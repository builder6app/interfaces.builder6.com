import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Db } from 'mongodb';
import { Page } from './schemas/page.schema';
import { Project } from './schemas/project.schema';
import { PageVersion } from './schemas/page-version.schema';
import { CreatePageDto } from './dto/create-page.dto';

@Injectable()
export class PlayService {
  constructor(@Inject('DATABASE_CONNECTION') private db: Db) {}

  private generateId(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async save(createPageDto: CreatePageDto, userId?: string): Promise<Page> {
    const { code, id, projectId, name, metaTitle, path, addToNavigation } = createPageDto;
    const now = new Date();

    // 1. Try to update existing page if ID is provided
    if (id) {
      const existingPage = await this.db.collection<Page>('play_pages').findOne({ _id: id });
      
      // If page exists AND belongs to the current user
      if (existingPage && existingPage.owner === userId && userId) {
        const newVersion: PageVersion = {
          _id: this.generateId(),
          pageId: id,
          code: existingPage.code, // Save previous code as version
          versionId: this.generateId(4),
          
          // Steedos Standard Fields
          owner: existingPage.owner,
          created: existingPage.modified || existingPage.created,
          created_by: existingPage.modified_by || existingPage.created_by,
        };

        // Save version
        await this.db.collection<PageVersion>('play_page_versions').insertOne(newVersion);

        // Update current page
        const updateFields: any = {
          code: code,
          modified: now,
          modified_by: userId
        };
        if (name) updateFields.name = name;
        if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
        if (path !== undefined) updateFields.path = path;
        if (addToNavigation !== undefined) updateFields.addToNavigation = addToNavigation;

        await this.db.collection<Page>('play_pages').updateOne(
          { _id: id },
          { $set: updateFields }
        );
        
        return { ...existingPage, ...updateFields };
      }
    }

    // 2. Create new page (Fork or New)
    const newPage: Page = {
      _id: this.generateId(),
      code,
      owner: userId,
      created: now,
      created_by: userId,
      modified: now,
      modified_by: userId,
      projectId: projectId,
      name: name || 'Untitled Page',
      metaTitle,
      path,
      addToNavigation
    };
    await this.db.collection<Page>('play_pages').insertOne(newPage);
    return newPage;
  }

  async findAllByProject(projectId: string): Promise<Page[]> {
    return this.db.collection<Page>('play_pages')
      .find({ projectId })
      .sort({ modified: -1 })
      .toArray();
  }

  async getVersions(pageId: string): Promise<PageVersion[]> {
    return this.db.collection<PageVersion>('play_page_versions')
      .find({ pageId })
      .sort({ created: -1 })
      .toArray();
  }

  async findAll(userId?: string): Promise<Page[]> {
    const query = userId ? { owner: userId } : {};
    return this.db.collection<Page>('play_pages').find(query).sort({ modified: -1 }).toArray();
  }

  async findOne(id: string): Promise<Page> {
    const page = await this.db
      .collection<Page>('play_pages')
      .findOne({ _id: id });
    if (!page) {
      throw new NotFoundException(`Page #${id} not found`);
    }
    return page;
  }

  async delete(id: string, userId: string): Promise<void> {
    const page = await this.findOne(id);
    if (page.owner !== userId) {
      throw new NotFoundException(`Page #${id} not found or you don't have permission`);
    }
    await this.db.collection<Page>('play_pages').deleteOne({ _id: id });
  }

  buildHtml(page: Page, project?: Project, navPages: Page[] = []): string {
    const title = page.metaTitle || page.name || 'Untitled Page';
    
    let navHtml = '';
    // Check if navigation should be displayed
    // 1. Project setting must be enabled
    // 2. Page setting can override (if explicitly set to false, hide it? Or if project is false, page can enable it?)
    // Let's assume: Project setting is the default. Page setting is an override if we had a tri-state, but currently page has 'addToNavigation' which is about *being in* the menu, not *showing* the menu.
    // Wait, the user said: "Project show have an option Display navigation on pages. You can override this setting on individual pages from the page settings."
    // This implies the page setting controls whether the navigation BAR is shown on THAT page.
    // But currently `addToNavigation` on Page means "Add this page TO the navigation menu".
    // We might need a new field on Page `displayNavigation` to override Project's `displayNavigation`.
    // However, let's look at the existing `addToNavigation`. It usually means "Show link to this page in the nav bar".
    // The user request "Display navigation on pages" likely means "Show the Nav Bar on this page".
    // So we need a new field `showNavigation` on Page?
    // Or maybe the user meant `addToNavigation`? No, "Display navigation on pages" vs "Add to navigation".
    // Let's assume for now we use the Project setting as the master switch for showing the bar.
    // If the user wants per-page override, we'd need a `showNavigation` field on Page.
    // Let's stick to Project setting for now as requested "Project show have an option...".
    // And "Override this setting on individual pages" -> We need `showNavigation` on Page.
    // But I haven't added `showNavigation` to Page schema yet.
    // Let's just use the Project setting for now to show the bar.
    
    // Actually, let's re-read: "You can override this setting on individual pages from the page settings."
    // This strongly implies a new field on Page.
    // But I'll implement the Project one first.
    
    if (project?.displayNavigation && navPages.length > 0) {
        const projectSlug = project.slug || project._id;
        const links = navPages.map(p => {
            const href = p.path ? `/site/${projectSlug}/${p.path}` : `/site/${projectSlug}/p/${p._id}`;
            const activeClass = p._id === page._id ? 'text-white font-medium' : 'text-gray-400 hover:text-white';
            return `<a href="${href}" class="${activeClass} transition-colors">${p.name}</a>`;
        }).join('');

        navHtml = `
        <nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <a href="/site/${projectSlug}" class="text-white font-bold text-lg tracking-tight">${project.name}</a>
                <div class="flex items-center gap-6 text-sm">
                    ${links}
                </div>
            </div>
        </nav>
        <div class="h-16"></div> <!-- Spacer -->
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black min-h-screen text-white">
    ${navHtml}
    ${page.code}
</body>
</html>`;
  }

  async findByPath(projectId: string, path: string): Promise<Page | null> {
    return this.db.collection<Page>('play_pages').findOne({ projectId, path });
  }
}
