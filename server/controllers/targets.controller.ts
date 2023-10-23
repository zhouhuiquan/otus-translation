import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';

import { LinkHelper } from '../link-helper';
import { TargetResponse, TargetsResponse } from '../models';
import { TranslationTargetRegistry } from '../persistence';
import { GitService } from '../services/git.service';
import { SyncService } from '../services/sync.service';
import { Response } from 'express';

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
      if (data) {
        return { data: null, message: 'commit success' };
      }
    } catch (error) {
      return { data: 'has error', message: 'comit failed' };
    }
  }

  @Get('extractI18n')
  async extracti18n() {
    try {
      await this.sync.extractI18n();
      return { data: null, message: 'extractI18n success' };
    } catch (error) {
      return { data: 'has error', message: 'extractI18n failed' };
    }
  }

  @Get('loadTranslatedFile')
  async loadTranslatedFile(@Res() res: Response) {
    try {
      const buffer = await this.sync.loadTranslatedFile();
      console.log(buffer.toJSON());
      res.set({
        'Content-Type': 'application/octet-stream',
      });
      res.send(buffer);
    } catch (error) {
      res.sendStatus(403);
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
