import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PropertyType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeService } from './home.service';

const mockGetHomes = [
  {
    id: 5,
    address: '1112 Avenue Ford',
    city: 'Houston',
    price: 2343424,
    image: 'img7',
    number_of_bedRooms: 4,
    number_of_bathrooms: 4,
    property_type: PropertyType.RESIDENTIAL,
    images: [
      {
        url: 'img1',
      },
    ],
  },
];

const mockHome = {
  id: 5,
  address: '1112 Avenue Ford',
  city: 'Houston',
  price: 2343424,
  image: 'img7',
  number_of_bedRooms: 4,
  number_of_bathrooms: 4,
  property_type: PropertyType.RESIDENTIAL,
};

const mockImages = [
  {
    id: '1',
    url: 'src1',
  },
  {
    id: '2',
    url: 'src2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockHome),
            },
           
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHomes', () => {
    const filters = {
      city: 'Toronto',
      price: {
        gte: 1000000,
        lte: 50000,
      },
      PropertyType: PropertyType.RESIDENTIAL,
    };
    it('should call prisma findmany with correct parameters', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);
      await service.getHomes(filters);
      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          id: true,
          address: true,
          city: true,
          price: true,
          property_type: true,
          number_of_bathrooms: true,
          number_of_bedrooms: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: filters,
      });
    });

    it('should throw not found exception', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);
      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: '1111 tellow atreet',
      numberOfBathrooms: 2,
      numberOfBedrooms: 3,
      city: 'Chicago',
      landSize: 32323,
      price: 60000,
      propertyType: PropertyType.RESIDENTIAL,
      images: [
        {
          url: 'src1',
        },
      ],
    };

    it('should call prisma home.create', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);
      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: '1111 tellow atreet',
          number_of_bathrooms: 2,
          number_of_bedrooms: 3,
          city: 'Chicago',
          land_size: 32323,
          realtor_id: 5,
          price: 60000,
          property_type: PropertyType.RESIDENTIAL,
        },
      });
    });
  });
});
