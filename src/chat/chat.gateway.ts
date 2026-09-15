import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    role: string;
    businessId?: string;
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { businessId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { businessId } = data;
    await client.join(businessId);
    this.logger.log(`User ${client.user.id} joined room ${businessId}`);
    
    client.emit('joinedRoom', { businessId, message: 'Successfully joined room' });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { businessId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { businessId } = data;
    await client.leave(businessId);
    this.logger.log(`User ${client.user.id} left room ${businessId}`);
    
    client.emit('leftRoom', { businessId, message: 'Successfully left room' });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { businessId: string; text: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { businessId, text } = data;
      const senderId = client.user.id;
      // ✅ FIXED: Use proper enum comparison instead of lowercase string
      const senderRole = client.user.role === 'Merchant' ? 'MERCHANT' : 'CUSTOMER';

      // Save message to database
      const savedMessage = await this.chatService.createMessage(senderId, senderRole, businessId, text);

      // Emit message to all clients in the room
      this.server.to(businessId).emit('message', savedMessage);

      this.logger.log(`Message sent in room ${businessId} by user ${senderId}`);
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}