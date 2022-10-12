import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

describe('HomeController', () => {
  let controller: HomeController;
  let homeService : HomeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [{
        provide: HomeService,
        useValue: {
          getHomes: jest.fn().mockReturnValue([])
        }
      }, PrismaService],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

   describe("getHomes", () => {
    it("should construct filter object correctly", async () => {

      const mockGetHomes = jest.fn().mockReturnValue([])
      jest.spyOn(homeService, "getHomes").mockImplementation(mockGetHomes)
       await controller.getHomes("Toronto", "15000")
       expect(mockGetHomes).toBeCalledWith({
        city: "Toronto",
        price: {
          gte: 15000
        }
       })
    })
   })
});
