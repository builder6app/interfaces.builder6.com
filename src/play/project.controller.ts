import { Body, Controller, Get, Param, Post, Put, Delete, Req, Res, Render, Redirect } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProjectService } from './project.service';
import { AuthService } from '../auth/auth.service';
import { PlayService } from './play.service';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    private readonly playService: PlayService
  ) {}

  @Get()
  async index(@Req() req: Request, @Res() res: Response) {
    const session = await this.authService.auth.api.getSession({
      headers: new Headers(req.headers as any),
    });
    if (!session) {
      return res.redirect('/login');
    }
    const projects = await this.projectService.findAll(session.user.id);
    return res.render('projects/index', { projects, user: session.user });
  }

  @Post()
  async create(@Req() req: Request, @Body('name') name: string, @Body('description') description: string, @Res() res: Response) {
    const session = await this.authService.auth.api.getSession({
      headers: new Headers(req.headers as any),
    });
    if (!session) {
      return res.redirect('/login');
    }
    await this.projectService.create(session.user.id, name, description);
    return res.redirect('/projects');
  }

  @Get(':id')
  async show(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const session = await this.authService.auth.api.getSession({
      headers: new Headers(req.headers as any),
    });
    if (!session) {
      return res.redirect('/login');
    }
    const project = await this.projectService.findOne(id);
    // Find pages belonging to this project
    const pages = await this.playService.findAllByProject(id);
    return res.render('projects/show', { project, pages, user: session.user });
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: any, @Res() res: Response) {
    const session = await this.authService.auth.api.getSession({
      headers: new Headers(req.headers as any),
    });
    if (!session) {
      return res.status(401).send('Unauthorized');
    }
    await this.projectService.update(id, session.user.id, body);
    return res.status(200).send('Updated');
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const session = await this.authService.auth.api.getSession({
      headers: new Headers(req.headers as any),
    });
    if (!session) {
      return res.status(401).send('Unauthorized');
    }
    await this.projectService.delete(id, session.user.id);
    return res.status(200).send('Deleted');
  }

  @Get(':id/settings')
  async settings(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
     // ... implementation if needed, but modal is in show.liquid
     return res.redirect(`/projects/${id}`);
  }

  @Get(':projectId/:pageId')
  async getPage(@Param('projectId') projectId: string, @Param('pageId') pageId: string, @Res() res: Response) {
    const page = await this.playService.findOne(pageId);
    if (!page) {
      return res.redirect(`/projects/${projectId}`);
    }
    return res.render('index', { page, projectId });
  }
}
