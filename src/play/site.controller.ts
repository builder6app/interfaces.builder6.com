import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PlayService } from './play.service';
import { ProjectService } from './project.service';

@Controller('site')
export class SiteController {
  constructor(
    private readonly playService: PlayService,
    private readonly projectService: ProjectService,
  ) {}

  @Get(':projectId')
  async getHome(@Param('projectId') projectId: string, @Res() res: Response) {
    const project = await this.projectService.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.homePage) {
      return res.status(404).send('This project does not have a home page set.');
    }

    const page = await this.playService.findOne(project.homePage);
    if (!page) {
      return res.status(404).send('Home page not found.');
    }

    const html = this.playService.buildHtml(page);
    return res.send(html);
  }

  @Get(':projectId/p/:pageId')
  async getPageById(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Res() res: Response,
  ) {
    const project = await this.projectService.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const page = await this.playService.findOne(pageId);
    if (!page || page.projectId !== projectId) {
      throw new NotFoundException('Page not found');
    }

    const html = this.playService.buildHtml(page);
    return res.send(html);
  }

  @Get(':projectId/:path')
  async getPage(
    @Param('projectId') projectId: string,
    @Param('path') path: string,
    @Res() res: Response,
  ) {
    const project = await this.projectService.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const page = await this.playService.findByPath(projectId, path);
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const html = this.playService.buildHtml(page);
    return res.send(html);
  }
}
