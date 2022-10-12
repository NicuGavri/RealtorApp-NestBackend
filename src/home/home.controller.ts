import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Param,
  ParseIntPipe,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PropertyType, UserType } from '@prisma/client';
import { UserInfo } from 'src/user/decorators/user.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { CreateHomeDto, HomeResponseDto, InquireDto, UpdateHomeDto } from './dto/home.dto';
import { HomeService } from './home.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/decorators/roles.decorators';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}
  @Get()
  getHomes(
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('propertyType') propertyType?: PropertyType,
  ): Promise<HomeResponseDto[]> {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          }
        : undefined;

    //property will be ommited if it is undefined
    const filters = {
      ...(city && { city }),
      ...(price && { price }),
      ...(propertyType && { propertyType }),
    };

    return this.homeService.getHomes(filters);
  }
  @Get(':id')
  getHomeById(@Param('id', ParseIntPipe) id: number) {
    return this.homeService.getHomeById(id);
  }

  @Roles(UserType.REALTOR, UserType.ADMIN)
  @Post()
  createHome(@Body() body: CreateHomeDto, @User() user: UserInfo) {
    return this.homeService.createHome(body, user.id);

  }

  @Roles(UserType.ADMIN, UserType.REALTOR)
  @Put(':id')
  async updateHome(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHomeDto,
    @User() user: UserInfo,
  ) {
    //get the realtor that the home was added by
    const realtor = await this.homeService.getRealtorByHomeId(id);

    //if the realtor that the home was added by does not match the logged in user id return
    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }
    return this.homeService.updateHomeById(id, body);
  }

  @Roles(UserType.ADMIN, UserType.REALTOR)
  @Delete(':id')
  async deleteHome(
    @Param('id', ParseIntPipe) id: number,
    @User() user: UserInfo,
  ) {
    //same logic as in update
    const realtor = await this.homeService.getRealtorByHomeId(id);

    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.deleteHomeById(id);
  }

  @Roles(UserType.BUYER)
  @Post('/:id/inquire') 
   inquire(
    @Param('id', ParseIntPipe) homeId: number,
    @User() user: UserInfo,
    @Body() body: InquireDto
   ){
      return this.homeService.inquire(user, homeId, body.message)
   }

   @Roles(UserType.REALTOR)
   @Get('/:id/messages')
   async getHomeMessages(
    @Param('id', ParseIntPipe) homeId: number,
    @User() user: UserInfo,
   ){
    const realtor = await this.homeService.getRealtorByHomeId(homeId);

    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }

   return this.homeService.getMessagesByHome(homeId)
   }
}
