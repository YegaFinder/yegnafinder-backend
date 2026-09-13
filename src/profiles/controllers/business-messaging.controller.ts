import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { Message } from '../entities/message.entity';
import { MessagesService } from '../services/messages.service';

@ApiTags('Business Messaging')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class BusinessMessagingController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a text message between an authenticated customer or merchant and a business' })
  async send(
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: User,
  ): Promise<Message> {
    return this.messagesService.send(dto, user);
  }

  @Get(':businessId')
  @ApiOperation({ summary: 'Fetch the ordered conversation between an authenticated user and a business' })
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: User,
  ): Promise<{ messages: Message[] }> {
    const messages = await this.messagesService.list(user, businessId);
    return { messages };
  }
}
