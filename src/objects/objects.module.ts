import { Module } from '@nestjs/common';
import { ObjectsController } from './objects.controller';
import { ObjectsService } from './objects.service';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [AiModule, DatabaseModule],
  controllers: [ObjectsController],
  providers: [ObjectsService],
  exports: [ObjectsService], // Export ObjectsService
})
export class ObjectsModule {}
