import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditAction } from '../common/services/audit.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string;
  private localStoragePath: string;
  private useLocalStorage: boolean = false;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents';
    this.localStoragePath = path.join(process.cwd(), 'uploads');

    if (!connectionString) {
      console.warn('Azure Storage connection string not configured. Using local file storage.');
      this.useLocalStorage = true;
      this.ensureLocalStorageDir();
    } else {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.ensureContainer();
    }
  }

  private ensureLocalStorageDir() {
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  private async ensureContainer() {
    if (this.blobServiceClient) {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists({ access: 'blob' });
    }
  }

  /**
   * Extract text content from uploaded file
   */
  private async extractTextContent(file: Express.Multer.File): Promise<string | null> {
    try {
      const mimeType = file.mimetype.toLowerCase();
      
      // Extract text from PDF
      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        this.logger.log(`Extracted ${pdfData.text.length} characters from PDF`);
        return pdfData.text;
      }
      
      // For text files, just convert buffer to string
      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        return file.buffer.toString('utf-8');
      }
      
      // For images, we could use OCR in the future
      // For now, just return null
      if (mimeType.startsWith('image/')) {
        this.logger.log('Image uploaded - OCR not implemented yet');
        return null;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to extract text content: ${error.message}`);
      return null;
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    patientId: string,
    userId: string,
    tags: string[] = [],
    metadata?: any,
  ) {
    // Generate unique file name
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    let url: string;

    if (this.useLocalStorage) {
      // Save to local file system
      const filePath = path.join(this.localStoragePath, fileName);
      fs.writeFileSync(filePath, file.buffer);
      url = `/uploads/${fileName}`;
    } else if (this.blobServiceClient) {
      // Upload to Azure Blob Storage
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      url = blockBlobClient.url;
    } else {
      throw new Error('No storage configured');
    }

    // Extract text content from the document
    const textContent = await this.extractTextContent(file);
    if (textContent) {
      this.logger.log(`Document content extracted: ${textContent.substring(0, 100)}...`);
    }

    // Save document metadata to database
    const document = await this.prisma.document.create({
      data: {
        filename: file.originalname,
        url,
        type: file.mimetype,
        tags,
        content: textContent,
        metadata: metadata || {},
        patientId,
      },
    });

    // Audit log
    this.auditService.logDocumentChange(
      AuditAction.DOCUMENT_UPLOADED,
      userId,
      patientId,
      document.id,
      file.originalname,
    );

    return document;
  }

  async getDocument(id: string, patientId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        patientId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async listDocuments(patientId: string) {
    return this.prisma.document.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(id: string, patientId: string, userId: string) {
    const document = await this.getDocument(id, patientId);

    // Delete file from storage
    if (this.useLocalStorage) {
      try {
        const fileName = document.url.split('/').pop();
        if (fileName) {
          const filePath = path.join(this.localStoragePath, fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (error) {
        console.error('Failed to delete local file:', error);
      }
    } else if (this.blobServiceClient) {
      try {
        const blobName = document.url.split('/').pop();
        if (blobName) {
          const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          await blockBlobClient.deleteIfExists();
        }
      } catch (error) {
        console.error('Failed to delete blob:', error);
      }
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { id },
    });

    // Audit log
    this.auditService.logDocumentChange(
      AuditAction.DOCUMENT_DELETED,
      userId,
      patientId,
      id,
      document.filename,
    );

    return { message: 'Document deleted successfully' };
  }
}
