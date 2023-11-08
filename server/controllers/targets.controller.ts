import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Response } from 'express';

import { LinkHelper } from '../link-helper';
import { TargetResponse, TargetsResponse } from '../models';
import { TranslationTargetRegistry } from '../persistence';
import { GitService } from '../services/git.service';
import { SyncService } from '../services/sync.service';

@Controller('targets')
export class TargetsController {
  constructor(
    private _translationTargetRegistry: TranslationTargetRegistry,
    private _linkHelper: LinkHelper,
    private git: GitService,
    private sync: SyncService
  ) {}

  @Get()
  targets(): TargetsResponse {
    return new TargetsResponse(this._translationTargetRegistry.keys(), this._linkHelper);
  }

  @Get('gitCommit')
  async syncGitFromRepo() {
    try {
      const data = await this.git.commitHandler();
      if (!data) {
        return { data: null, message: 'commit success', code: 0 };
      }
      return { data: data, message: 'Commit Failed', code: 1 };
    } catch (error) {
      return { data: error, message: 'commit failed', code: 1 };
    }
  }

  @Get('syncLocalization')
  async syncLocalization() {
    try {
      await this.git.syncLocalizationToDesktop();
      return { data: null, code: 0 };
    } catch (error) {
      return {
        data: null,
        error,
        code: 1,
      };
    }
  }

  @Get('extractI18n')
  async extracti18n() {
    try {
      await this.sync.extractI18n();
      return { data: null, message: 'extractI18n success' };
    } catch (error) {
      return { data: error, message: 'extractI18n failed' };
    }
  }

  @Get('loadTranslatedFile')
  async loadTranslatedFile(@Res() res: Response) {
    try {
      const buffer = await this.sync.loadTranslatedFile();
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment;',
      });
      res.send(buffer);
    } catch (error) {
      res.sendStatus(403);
    }
  }

  @Get('sortedId')
  async loadSortedId() {
    return await this.sync.getSortedId();
  }

  // @Post('sortedId')
  // @UseInterceptors(FileInterceptor('file'))
  // async saveSortedId(@UploadedFile() file: any) {
  //   await this.sync.saveSortedId(["111", "mingyue"])
  // }

  @Get('restart')
  async restart() {
    this.sync.restart();
  }

  @Post('saveTranslatedFile')
  @UseInterceptors(FileInterceptor('file'))
  async saveTranslatedFile(@UploadedFile() file: any) {
    try {
      await this.sync.loadTranslatedFile();
      await this.sync.saveTranslatedFile(file);
      return { message: 'success', code: 0 };
    } catch (error) {
      return { message: error, code: 1 };
    }
  }

  @Get(':language')
  target(@Param('language') language: string) {
    const target = this._translationTargetRegistry.get(language);
    if (!target) {
      throw new NotFoundException('Target does not exist');
    }

    return new TargetResponse(target, this._linkHelper);
  }

  @Post(':language')
  async createTarget(@Param('language') language: string) {
    const existingTarget = this._translationTargetRegistry.get(language);
    if (existingTarget) {
      throw new BadRequestException('Target already exists');
    }

    const target = await this._translationTargetRegistry.create(language);

    return new TargetResponse(target, this._linkHelper);
  }
}
