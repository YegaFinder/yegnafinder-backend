import { Controller, Post, Get, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateMessageDto, ConversationQueryDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid message data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    const { businessId, text } = createMessageDto;
    const senderId = req.user.id;
    const senderRole = req.user.role === 'merchant' ? 'MERCHANT' : 'CUSTOMER';

    const message = await this.chatService.createMessage(senderId, senderRole, businessId, text);
    return { data: message };
  }

  @Get(':businessId')
  @ApiOperation({ summary: 'Get conversation messages for a business' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getConversation(
    @Param('businessId') businessId: string,
    @Query() query: ConversationQueryDto,
  ) {
    const { page = 1, limit = 50 } = query;
    const conversation = await this.chatService.getConversation(businessId, page, limit);
    return { data: conversation };
  }

  @Get('merchant/threads')
  @UseGuards(RolesGuard)
  @Roles('merchant')
  @ApiOperation({ summary: 'Get customer conversation threads for merchant' })
  @ApiResponse({ status: 200, description: 'Threads retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - merchant role required.' })
  async getMerchantThreads(@Request() req) {
    // For merchants, we need to get their business ID
    // This assumes the merchant's business ID is available in the user object
    const businessId = req.user.businessId || req.user.id;
    const threads = await this.chatService.getMerchantThreads(businessId);
    return { data: threads };
  }
}