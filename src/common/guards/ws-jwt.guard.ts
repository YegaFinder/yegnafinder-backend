import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user: any;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.user = payload;
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
    
    if (!token) {
      return null;
    }

    // Handle "Bearer <token>" format
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      return token.substring(7);
    }

    return typeof token === 'string' ? token : null;
  }
}