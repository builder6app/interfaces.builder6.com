import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  getHello() {
    return {};
  }

  @Get('login')
  @Render('login')
  getLogin() {
    return {};
  }

  @Get('register')
  @Render('register')
  register() {
    return {};
  }
}
