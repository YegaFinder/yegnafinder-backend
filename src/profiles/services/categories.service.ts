import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategory } from '../entities/business-category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(BusinessCategory)
    private readonly categoriesRepository: Repository<BusinessCategory>,
  ) {}

  async create(data: { name: string; description?: string; parentId?: string }): Promise<BusinessCategory> {
    const existing = await this.categoriesRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoriesRepository.create({
      name: data.name,
      description: data.description,
    });

    if (data.parentId) {
      const parent = await this.categoriesRepository.findOne({ where: { id: data.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      category.parentCategory = parent;
    }

    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<BusinessCategory[]> {
    // Return all top-level categories with their subcategories
    return this.categoriesRepository.find({
      where: { parentCategory: null },
      relations: ['subCategories'],
    });
  }

  async findOne(id: string): Promise<BusinessCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['subCategories', 'parentCategory'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, data: { name?: string; description?: string; parentId?: string }): Promise<BusinessCategory> {
    const category = await this.findOne(id);

    if (data.name) {
      const existing = await this.categoriesRepository.findOne({ where: { name: data.name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
      category.name = data.name;
    }

    if (data.description !== undefined) {
      category.description = data.description;
    }

    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        category.parentCategory = null;
      } else {
        const parent = await this.categoriesRepository.findOne({ where: { id: data.parentId } });
        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }
        category.parentCategory = parent;
      }
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  async seed(): Promise<{ message: string }> {
    const defaultCategories = [
      { name: 'Food & Dining', description: 'Restaurants, cafes, and bakeries' },
      { name: 'Health & Wellness', description: 'Hospitals, clinics, gyms, and spas' },
      { name: 'Retail & Shopping', description: 'Supermarkets, boutiques, and electronics' },
      { name: 'Home Services', description: 'Plumbing, cleaning, and electrical services' },
      { name: 'Professional Services', description: 'Legal, accounting, and consulting' },
    ];

    let seededCount = 0;
    for (const cat of defaultCategories) {
      const existing = await this.categoriesRepository.findOne({ where: { name: cat.name } });
      if (!existing) {
        const newCategory = this.categoriesRepository.create(cat);
        await this.categoriesRepository.save(newCategory);
        seededCount++;
      }
    }

    return { message: `Seeded ${seededCount} new categories successfully` };
  }
}
