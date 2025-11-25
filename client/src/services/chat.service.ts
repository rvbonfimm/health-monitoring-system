import api from '@/lib/axios';
import { ChatMessage, ChatRequest, ChatResponse } from '@/types';

export const chatService = {
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat', data);
    return response.data;
  },

  async getConversation(conversationId: string): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  async uploadDocument(file: File): Promise<{ url: string; documentId: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
