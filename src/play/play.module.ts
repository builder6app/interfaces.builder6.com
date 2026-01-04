import { Module } from '@nestjs/common';
import { PlayController } from './play.controller';
import { PlayService } from './play.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PlayController],
  providers: [PlayService],
})
export class PlayModule {}
