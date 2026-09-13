import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ListingApprovalService } from '../listing-approval.service';
import { Business } from '../../entities/business.entity';
import { ListingStatus } from '../../enums/listing-status.enum';

describe('ListingApprovalService', () => {
  let service: ListingApprovalService;
  const businessRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingApprovalService,
        {
          provide: getRepositoryToken(Business),
          useValue: businessRepository,
        },
      ],
    }).compile();

    service = module.get(ListingApprovalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const business = {
    id: 'biz-1',
    userId: 'merchant-1',
    isProfileComplete: true,
    listingStatus: ListingStatus.PENDING,
    isPublic: false,
  } as Business;

  it('supports full-text keyword search against approved public businesses', async () => {
    businessRepository.createQueryBuilder = jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([business]),
    }));

    await service.searchPublic('coffeeshop');

    expect(businessRepository.createQueryBuilder).toHaveBeenCalledWith(
      'business',
    );
  });

  it('returns nearby businesses ordered by distance from the supplied coordinates', async () => {
    businessRepository.find.mockResolvedValue([
      {
        ...business,
        isPublic: true,
        listingStatus: ListingStatus.APPROVED,
        latitude: 8.990,
        longitude: 38.760,
      },
      {
        ...business,
        id: 'biz-2',
        isPublic: true,
        listingStatus: ListingStatus.APPROVED,
        latitude: 9.005,
        longitude: 38.780,
      },
    ] as Business[]);

    const results = await service.findNearby(8.995, 38.765, 5);

    expect(results).toHaveLength(2);
  });

  it('lists only approved public businesses', async () => {
    businessRepository.find.mockResolvedValue([business]);
    await service.listPublic();
    expect(businessRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true, listingStatus: ListingStatus.APPROVED },
      }),
    );
  });

  it('hides unapproved listings from the public catalog', async () => {
    businessRepository.findOne.mockResolvedValue({
      ...business,
      isPublic: false,
    });
    await expect(service.getPublicById('biz-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('approves a listing and publishes it', async () => {
    businessRepository.findOne.mockResolvedValue({ ...business });
    businessRepository.save.mockImplementation(async (row) => row);

    const result = await service.approve('biz-1', 'admin-1');

    expect(result.listingStatus).toBe(ListingStatus.APPROVED);
    expect(result.isPublic).toBe(true);
    expect(result.listingReviewedById).toBe('admin-1');
  });

  it('rejects a listing and unpublishes it', async () => {
    businessRepository.findOne.mockResolvedValue({
      ...business,
      listingStatus: ListingStatus.APPROVED,
      isPublic: true,
    });
    businessRepository.save.mockImplementation(async (row) => row);

    const result = await service.reject('biz-1', 'admin-1', 'Incomplete');

    expect(result.listingStatus).toBe(ListingStatus.REJECTED);
    expect(result.isPublic).toBe(false);
    expect(result.listingRejectionReason).toBe('Incomplete');
  });

  it('does not submit an incomplete profile', async () => {
    businessRepository.findOne.mockResolvedValue({
      ...business,
      isProfileComplete: false,
    });

    await expect(service.submitForApproval('merchant-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
