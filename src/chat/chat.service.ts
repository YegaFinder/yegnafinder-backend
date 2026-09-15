import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

  async createMessage(
    senderId: string,
    senderRole: 'CUSTOMER' | 'MERCHANT',
    businessId: string,
    text: string,
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      senderId,
      senderRole,
      businessId,
      text,
    });

    return await this.messageRepository.save(message);
  }

  async getConversation(
    businessId: string,
    page: number = 1,
    limit: number = 50,
    userId?: string,  // ✅ FIXED: Added for access control
    userRole?: string,  // ✅ FIXED: Added for access control
  ): Promise<{
    items: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // ✅ FIXED: Add basic ownership validation
    // TODO: Add proper merchant business ownership check
    let whereClause: any = { businessId };

    if (userRole === 'Customer' && userId) {
      // Customers can only see messages they sent
      whereClause = {
        businessId,
        senderId: userId,
      };
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: messages,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMerchantThreads(businessId: string): Promise<{
    senderId: string;
    senderRole: string;
    lastMessage: string;
    lastMessageAt: Date;
  }[]> {
    const threads = await this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.senderId as "senderId"',
        'message.senderRole as "senderRole"',
        'message.text as "lastMessage"',
        'message.createdAt as "lastMessageAt"',
      ])
      .where('message.businessId = :businessId', { businessId })
      .andWhere('message.senderRole = :senderRole', { senderRole: 'CUSTOMER' })
      .orderBy('message.createdAt', 'DESC')
      .groupBy('message.senderId, message.senderRole, message.text, message.createdAt')
      .distinctOn(['message.senderId'])
      .getRawMany();

    return threads;
  }
}