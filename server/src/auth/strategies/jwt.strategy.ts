import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Get patient ID if user has an associated patient record
    const patient = await this.prisma.patient.findFirst({
      where: { userId: payload.sub },
      select: { id: true },
    });

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      patientId: patient?.id || null,
    };
  }
}
