import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async send(dto: CreateMessageDto, user: User): Promise<Message> {
    if (!dto.businessId) {
      throw new BadRequestException('businessId is required');
    }

    const text = dto.text?.trim();
    if (!text) {
      throw new BadRequestException('text is required');
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Only a customer can create a message through this authenticated route.',
      );
    }

    const customerId = user.id;
    const conversationId = dto.conversationId || `${customerId}:${dto.businessId}`;

    const row = this.messageRepository.create({
      conversationId,
      customerId,
      businessId: dto.businessId,
      senderRole: 'customer',
      text,
    });

    return this.messageRepository.save(row);
  }

  async list(user: User, businessId: string): Promise<Message[]> {
    if (!businessId) {
      throw new BadRequestException('businessId is required');
    }

    const where =
      user.role === UserRole.CUSTOMER
        ? { customerId: user.id, businessId }
        : { businessId };

    return this.messageRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  async findConversation(conversationId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }
}
