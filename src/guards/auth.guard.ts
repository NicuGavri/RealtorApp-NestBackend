import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

//1)Determine user types that can execute the called endpoint
//2) Grab JWT from request header and verify it
//3) Determine the type of user, database request to get user by id
//4) Determine if user has permissions

interface JWTPayload {
  name: string;
  id: number;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    //1)
    //reflector allows us to access MetaData, so grab the roles from the reflector
    //in the array we specify where we want to get the meta data, specifically from the request(context)
    const roles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);


    if (roles?.length) {
      //2)
      const request = context.switchToHttp().getRequest();
      const token = request?.headers?.authorization?.split('Bearer ')[1];

      try {
        //3)
        const payload = jwt.verify(
          token,
          process.env.JSON_TOKEN_KEY,
        ) as JWTPayload;

        const user = await this.prismaService.user.findUnique({
          where: {
            id: payload.id,
          },
        });
        if (!user) return false;
        if (roles.includes(user.user_type)) return true;
        return false;
      } catch (error) {
        console.log(error)
        return false;

      }
    }

    return true;
  }
}
