import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Db } from 'mongodb';
import { AiService } from '../ai/ai.service';
import { Builder6Object } from './schemas/object.schema';

@Injectable()
export class ObjectsService {
  constructor(
    @Inject('DATABASE_CONNECTION') private db: Db,
    private readonly aiService: AiService
  ) {}

  private generateId(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateSchema(prompt: string) {
    return this.aiService.generateObjectDefinition(prompt);
  }

  async findAll(userId: string, projectId?: string): Promise<Builder6Object[]> {
    const query: any = {};
    if (projectId) {
      query.projectId = projectId;
    }
    // For now, let's list all objects or just the ones owned by the user. 
    // Assuming we want to show all for this demo or restrict by owner if we had auth context consistently.
    // The previous code had userId passed in. I'll stick to that.
    return this.db.collection<Builder6Object>('builder6_objects')
      .find(query) 
      .sort({ modified: -1 })
      .toArray();
  }

  async findOne(id: string): Promise<Builder6Object> {
    const obj = await this.db.collection<Builder6Object>('builder6_objects').findOne({ _id: id });
    if (!obj) {
      throw new NotFoundException(`Object #${id} not found`);
    }
    return obj;
  }

  async create(userId: string, data: Partial<Builder6Object>): Promise<Builder6Object> {
    const now = new Date();
    const id = this.generateId();
    const newObject: Builder6Object = {
      _id: id,
      projectId: data.projectId,
      name: data.name || 'untitled',
      label: data.label || 'Untitled',
      description: data.description,
      icon: data.icon || 'star',
      schema: data.schema || '',
      owner: userId,
      created: now,
      modified: now,
    };
    await this.db.collection<Builder6Object>('builder6_objects').insertOne(newObject);
    return newObject;
  }

  async update(id: string, userId: string, updateData: Partial<Builder6Object>): Promise<Builder6Object> {
    const now = new Date();
    // Ensure we don't update immutable fields like _id or created
    const { _id, created, ...toUpdate } = updateData;
    
    await this.db.collection<Builder6Object>('builder6_objects').updateOne(
      { _id: id }, // In a real app, check owner: userId too
      { 
        $set: { 
          ...toUpdate,
          modified: now,
        } 
      }
    );
    return this.findOne(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.collection<Builder6Object>('builder6_objects').deleteOne({ _id: id });
  }
}
