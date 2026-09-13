import { Controller, Get, Patch, Param, UseGuards, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Whether the user is active or banned' })
  isActive: boolean;
}

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('role') role?: UserRole,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const { data, total } = await this.usersService.findAll(pageNumber, limitNumber, role);
    
    // Exclude password hashes
    const safeUsers = data.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
    
    return { data: safeUsers, total, page: pageNumber, limit: limitNumber };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ban or unban a user' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const user = await this.usersService.updateStatus(id, dto.isActive);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
