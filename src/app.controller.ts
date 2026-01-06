import { Controller, Get, Render, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index(@Res() res: Response) {
    return res.redirect('/app');
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
