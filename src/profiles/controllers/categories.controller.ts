import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from '../services/categories.service';

// DTOs for category creation
class CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
}

class UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string;
}

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business category' })
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return { data: category };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default business categories' })
  async seed() {
    return this.categoriesService.seed();
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all top-level business categories with subcategories' })
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return { data: categories };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific business category by ID' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    return { data: category };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a business category' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, dto);
    return { data: category };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business category' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
  }
}
