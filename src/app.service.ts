import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Db } from 'mongodb';
import { Snippet } from './schemas/snippet.schema';
import { CreateSnippetDto } from './dto/create-snippet.dto';

@Injectable()
export class AppService {
  constructor(@Inject('DATABASE_CONNECTION') private db: Db) {}

  getHello(): string {
    return 'Hello World!';
  }

  private generateId(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async create(createSnippetDto: CreateSnippetDto): Promise<Snippet> {
    const newSnippet: Snippet = {
      _id: this.generateId(),
      ...createSnippetDto,
      createdAt: new Date(),
    };
    await this.db.collection<Snippet>('snippets').insertOne(newSnippet);
    return newSnippet;
  }

  async findAll(): Promise<Snippet[]> {
    return this.db.collection<Snippet>('snippets').find().toArray();
  }

  async findOne(id: string): Promise<Snippet> {
    const snippet = await this.db
      .collection<Snippet>('snippets')
      .findOne({ _id: id });
    if (!snippet) {
      throw new NotFoundException(`Snippet #${id} not found`);
    }
    return snippet;
  }

  buildHtml(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    ${code}
</body>
</html>`;
  }
}
