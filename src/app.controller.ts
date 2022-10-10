import { Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './user/auth/auth.service';

@Controller()
export class AppController {
}
