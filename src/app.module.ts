import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayModule } from './play/play.module';

@Module({
  imports: [PlayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
