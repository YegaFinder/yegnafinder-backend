import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusinessHoursService } from '../business-hours.service';
import { BusinessHours, DayOfWeek } from '../../entities/business-hours.entity';
import { Business } from '../../entities/business.entity';
import { BusinessHoursDto } from '../../dto/business-hours.dto';

describe('BusinessHoursService', () => {
  let service: BusinessHoursService;
  let businessHoursRepository: Repository<BusinessHours>;
  let businessRepository: Repository<Business>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessHoursService,
        {
          provide: getRepositoryToken(BusinessHours),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BusinessHoursService>(BusinessHoursService);
    businessHoursRepository = module.get<Repository<BusinessHours>>(
      getRepositoryToken(BusinessHours),
    );
    businessRepository = module.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateBusinessHours', () => {
    const merchantProfileId = 'profile-123';
    const validHoursData: BusinessHoursDto[] = Object.values(DayOfWeek).map(
      (day) => ({
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '17:00',
        isClosed: false,
        is24Hours: false,
      }),
    );

    it('should throw NotFoundException when business not found', async () => {
      jest.spyOn(businessRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateBusinessHours(merchantProfileId, validHoursData),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when missing days', async () => {
      const business = { id: merchantProfileId } as Business;
      jest
        .spyOn(businessRepository, 'findOne')
        .mockResolvedValue(business);

      const incompleteData = validHoursData.slice(0, 5); // Missing 2 days

      await expect(
        service.updateBusinessHours(merchantProfileId, incompleteData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create business hours', async () => {
      const business = { id: merchantProfileId } as Business;
      const createdHours = validHoursData.map((h) => ({ ...h, id: 'hour-id' }));

      jest
        .spyOn(businessRepository, 'findOne')
        .mockResolvedValue(business);
      const deleteSpy = jest
        .spyOn(businessHoursRepository, 'delete')
        .mockResolvedValue({ affected: 7 } as DeleteResult);
      jest
        .spyOn(businessHoursRepository, 'create')
        .mockImplementation((data) => data as BusinessHours);
      const saveSpy = jest
        .spyOn(businessHoursRepository, 'save')
        .mockResolvedValue(createdHours as any);

      const result = await service.updateBusinessHours(
        merchantProfileId,
        validHoursData,
      );

      expect(result).toEqual(createdHours);
      expect(deleteSpy).toHaveBeenCalledWith({
        businessId: merchantProfileId,
      });
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw BadRequestException when close time is before open time', async () => {
      const business = { id: merchantProfileId } as Business;
      jest
        .spyOn(businessRepository, 'findOne')
        .mockResolvedValue(business);

      const invalidHours = validHoursData.map((hours, index) =>
        index === 0
          ? { ...hours, openTime: '17:00', closeTime: '09:00' }
          : hours,
      );

      await expect(
        service.updateBusinessHours(merchantProfileId, invalidHours),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when break is outside business hours', async () => {
      const business = { id: merchantProfileId } as Business;
      jest
        .spyOn(businessRepository, 'findOne')
        .mockResolvedValue(business);

      const invalidHours = validHoursData.map((hours, index) =>
        index === 0
          ? { ...hours, breakStartTime: '08:00', breakEndTime: '09:30' }
          : hours,
      );

      await expect(
        service.updateBusinessHours(merchantProfileId, invalidHours),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBusinessHours', () => {
    it('should return business hours ordered by day', async () => {
      const hours = [{ dayOfWeek: DayOfWeek.MONDAY }] as BusinessHours[];
      const findSpy = jest
        .spyOn(businessHoursRepository, 'find')
        .mockResolvedValue(hours);

      const result = await service.getBusinessHours('profile-123');

      expect(result).toEqual(hours);
      expect(findSpy).toHaveBeenCalledWith({
        where: { businessId: 'profile-123' },
        order: { dayOfWeek: 'ASC' },
      });
    });
  });

  describe('isOpenNow', () => {
    const merchantProfileId = 'profile-123';

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return false when business is closed', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));

      jest.spyOn(businessHoursRepository, 'findOne').mockResolvedValue({
        dayOfWeek: DayOfWeek.MONDAY,
        isClosed: true,
      } as BusinessHours);

      await expect(service.isOpenNow(merchantProfileId)).resolves.toBe(false);
    });

    it('should return true when business is open 24 hours', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));

      jest.spyOn(businessHoursRepository, 'findOne').mockResolvedValue({
        dayOfWeek: DayOfWeek.MONDAY,
        isClosed: false,
        is24Hours: true,
      } as BusinessHours);

      await expect(service.isOpenNow(merchantProfileId)).resolves.toBe(true);
    });

    it('should return true during regular business hours', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00'));

      jest.spyOn(businessHoursRepository, 'findOne').mockResolvedValue({
        dayOfWeek: DayOfWeek.MONDAY,
        isClosed: false,
        is24Hours: false,
        openTime: '09:00',
        closeTime: '17:00',
      } as BusinessHours);

      await expect(service.isOpenNow(merchantProfileId)).resolves.toBe(true);
    });

    it('should return false during break time', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:30:00'));

      jest.spyOn(businessHoursRepository, 'findOne').mockResolvedValue({
        dayOfWeek: DayOfWeek.MONDAY,
        isClosed: false,
        is24Hours: false,
        openTime: '09:00',
        closeTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
      } as BusinessHours);

      await expect(service.isOpenNow(merchantProfileId)).resolves.toBe(false);
    });
  });
});
