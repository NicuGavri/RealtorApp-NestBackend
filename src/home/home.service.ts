import { Injectable, NotFoundException } from '@nestjs/common';
import { PropertyType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserInfo } from 'src/user/decorators/user.decorator';
import { HomeResponseDto } from './dto/home.dto';

interface getHomesParam {
  city?: string;
  price?: {
    gte?: number;
    lte?: number;
  };
  propertyType?: PropertyType;
}

interface CreateHomeParams {
  address: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  city: string;
  price: number;
  landSize: number;
  propertyType: PropertyType;
  images: { url: string }[];
}


interface UpdateHomeParams {
  address?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  city?: string;
  price?: number;
  landSize?: number;
  propertyType?: PropertyType;
}

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}
  async getHomes(filter: getHomesParam): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
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
      where: filter,
    });

    if (!homes.length) {
      throw new NotFoundException();
    }

    return homes.map((home) => {
      const fetchHome = { ...home, image: home.images[0].url };
      delete fetchHome.images;
      return new HomeResponseDto(fetchHome);
    });
  }

  async getHomeById(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });

    if (!home) {
      throw new NotFoundException();
    }

    return new HomeResponseDto(home);
  }

  async createHome(body: CreateHomeParams, userId: number) {
    const home = await this.prismaService.home.create({
      data: {
        address: body.address,
        number_of_bathrooms: body.numberOfBathrooms,
        number_of_bedrooms: body.numberOfBedrooms,
        city: body.city,
        price: body.price,
        property_type: body.propertyType,
        land_size: body.landSize,
        realtor_id: userId,
      },
    });

    const images = body.images.map((image) => {
      return { ...image, home_id: home.id };
    });

    await this.prismaService.image.createMany({
      data: images,
    });

    return new HomeResponseDto(home);
  }

  async updateHomeById(id: number, body: UpdateHomeParams){
    const home =  await this.prismaService.home.findUnique({
      where : {
        id
      }
    })

     if(!home) {
      throw new NotFoundException()
     }

     const updatedHome = await this.prismaService.home.update({
      where: {
        id
      },
      data: body
    })

    return new HomeResponseDto(updatedHome)
  }

  async deleteHomeById(id: number) {
    await this.prismaService.home.delete({
      where: {
        id,
      }
    })
  }

  async getRealtorByHomeId(id: number){
    const home = await this.prismaService.home.findUnique({
      where: {
        id
      },
      select: {
        realtor : {
          select: {
            name: true,
            id: true,
            email: true,
            phone: true,
          }
        }
      
      }
    })

    if(!home) {
      throw new NotFoundException()
    }

    return home.realtor
  }

  async inquire(buyer: UserInfo, homeId: number, message: string){
     const realtor = await this.getRealtorByHomeId(homeId)

     const newMessage = await this.prismaService.message.create({
      data: {
        realtor_id: realtor.id,
        buyer_id: buyer.id,
        home_id: homeId,
        message
      }
     })

     return newMessage
  }
 getMessagesByHome(homeId: number) {
    return this.prismaService.message.findMany({
      where: {
        home_id: homeId
      }
    })
  }

}
