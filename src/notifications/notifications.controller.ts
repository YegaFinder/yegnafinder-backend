import { Controller, Get, Patch, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationQueryDto } from './dto/notification-query.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Request() req, @Query() query: NotificationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const userId = req.user.id;
    
    const notifications = await this.notificationsService.findAll(userId, page, limit);
    return { data: notifications };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const notification = await this.notificationsService.markAsRead(id, userId);
      return { data: notification };
    } catch (error) {
      throw new NotFoundException('Notification not found');
    }
  }
}