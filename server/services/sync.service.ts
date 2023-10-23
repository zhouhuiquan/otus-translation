import { exec } from 'child_process';
import { readFile } from 'fs/promises';

import { Injectable } from '@nestjs/common';

@Injectable()
export class SyncService {
  extractI18n(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec('npx nx extract-i18n --skip-nx-cache', (err) => {
        if (!err) {
          resolve();
        }
        reject();
      });
    });
  }

  loadTranslatedFile(): Promise<Buffer> {
    return readFile('apps/otus-app/src/assets/translations/messages.zh-CN.json');
  }
}
