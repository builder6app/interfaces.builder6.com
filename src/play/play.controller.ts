import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { PlayService } from './play.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { Snippet } from './schemas/snippet.schema';

@Controller()
export class PlayController {
  constructor(private readonly playService: PlayService) {}

  @Post('api/snippets')
  async create(@Body() createSnippetDto: CreateSnippetDto): Promise<Snippet> {
    return this.playService.create(createSnippetDto);
  }

  @Get('api/snippets')
  async findAll(): Promise<Snippet[]> {
    return this.playService.findAll();
  }

  @Get('api/snippets/:id')
  async findOne(@Param('id') id: string): Promise<Snippet> {
    return this.playService.findOne(id);
  }

  @Get('view/:id')
  async viewSnippet(@Param('id') id: string, @Res() res: Response) {
    const snippet = await this.playService.findOne(id);
    const html = this.playService.buildHtml(snippet.code);
    res.set('Content-Type', 'text/html');
    res.send(html);
  }

  @Get(':id')
  async getSnippetPage(@Param('id') id: string, @Res() res: Response) {
    return res.sendFile(join(__dirname, '..', '..', 'public', 'index.html'));
  }
}
