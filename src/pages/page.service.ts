import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Db } from 'mongodb';
import { Page } from './schemas/page.schema';
import { Project } from '../projects/schemas/project.schema';
import { PageVersion } from './schemas/page-version.schema';
import { CreatePageDto } from './dto/create-page.dto';

@Injectable()
export class PageService {
  constructor(@Inject('DATABASE_CONNECTION') private db: Db) {}

  private generateId(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // private sanitizeProjectCode(code: string): string {
  //   if (!code) return code;
    
  //   // Check if it's a full HTML document
  //   if (code.match(/<!DOCTYPE html>/i) || code.match(/<html/i)) {
      
  //     // 1. Remove DOCTYPE
  //     let newCode = code.replace(/<!DOCTYPE html>/gi, '');

  //     // 2. Remove html tags
  //     newCode = newCode.replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '');

  //     // 3. Remove title and meta tags
  //     newCode = newCode.replace(/<title>[\s\S]*?<\/title>/gi, '');
  //     newCode = newCode.replace(/<meta[^>]*>/gi, '');

  //     // 4. Remove head tags but KEEP content (scripts, styles)
  //     newCode = newCode.replace(/<head[^>]*>/gi, '').replace(/<\/head>/gi, '');

  //     // 5. Transform body tag to div, and fix classes
  //     newCode = newCode.replace(/<body([^>]*)>/gi, (match, attrs) => {
  //         let newAttrs = attrs
  //           .replace(/h-screen/g, 'h-full')
  //           .replace(/w-screen/g, 'w-full');
          
  //         return `<div id="body-wrapper" ${newAttrs}>`;
  //     });
      
  //     newCode = newCode.replace(/<\/body>/gi, '</div>');

  //     return newCode.trim();
  //   }
    
  //   return code;
  // }

  async save(createPageDto: CreatePageDto, userId?: string): Promise<Page> {
    const { code: rawCode, id, projectId, name, metaTitle, slug, addToNavigation } = createPageDto;
    // Don't sanitize code, allow full HTML documents
    const code = rawCode;
    const now = new Date();

    // 1. Try to update existing page if ID is provided
    if (id) {
      const existingPage = await this.db.collection<Page>('builder6_pages').findOne({ _id: id });
      
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
        await this.db.collection<PageVersion>('builder6_page_versions').insertOne(newVersion);

        // Update current page
        const updateFields: any = {
          code: code,
          modified: now,
          modified_by: userId
        };
        if (name) updateFields.name = name;
        if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
        if (slug !== undefined) updateFields.slug = slug;
        if (addToNavigation !== undefined) updateFields.addToNavigation = addToNavigation;

        await this.db.collection<Page>('builder6_pages').updateOne(
          { _id: id },
          { $set: updateFields }
        );
        
        return { ...existingPage, ...updateFields };
      }
    }

    // 2. Create new page (Fork or New)
    const newId = this.generateId();
    const newPage: Page = {
      _id: newId,
      code,
      owner: userId,
      created: now,
      created_by: userId,
      modified: now,
      modified_by: userId,
      projectId: projectId,
      name: name || 'Untitled Page',
      metaTitle,
      slug: newId.toLowerCase(),
      addToNavigation
    };
    await this.db.collection<Page>('builder6_pages').insertOne(newPage);
    return newPage;
  }

  async findAllByProject(projectId: string): Promise<Page[]> {
    return this.db.collection<Page>('builder6_pages')
      .find({ projectId })
      .sort({ sortOrder: 1, modified: -1 })
      .toArray();
  }

  async reorder(items: { id: string, sortOrder: number }[], userId?: string): Promise<void> {
    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { _id: item.id, owner: userId },
        update: { $set: { sortOrder: item.sortOrder } }
      }
    }));

    if (bulkOps.length > 0) {
      await this.db.collection<Page>('builder6_pages').bulkWrite(bulkOps);
    }
  }

  async getVersions(pageId: string): Promise<PageVersion[]> {
    return this.db.collection<PageVersion>('builder6_page_versions')
      .find({ pageId })
      .sort({ created: -1 })
      .toArray();
  }

  async findAll(userId?: string): Promise<Page[]> {
    const query = userId ? { owner: userId } : {};
    return this.db.collection<Page>('builder6_pages').find(query).sort({ modified: -1 }).toArray();
  }

  async findOne(id: string): Promise<Page> {
    const page = await this.db
      .collection<Page>('builder6_pages')
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
    await this.db.collection<Page>('builder6_pages').deleteOne({ _id: id });
  }

  async findByPath(projectId: string, path: string): Promise<Page | null> {
    return this.db.collection<Page>('builder6_pages').findOne({ projectId, path });
  }
}
