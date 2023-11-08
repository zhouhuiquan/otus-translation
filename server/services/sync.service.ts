import { exec } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { Injectable } from '@nestjs/common';

import { TargetPathBuilder } from '../persistence';
import { TargetInfo } from '../target-info';

@Injectable()
export class SyncService {
  constructor(private targetInfo: TargetInfo, private _targetPathBuilder: TargetPathBuilder) {}

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

  loadTranslatedFile(): Promise<void> {
    return readFile(this.targetInfo.autoTargetFile!).then((buffer) => {
      let data: any = [];
      try {
        data = JSON.parse(buffer.toString('utf-8'));
        data = Object.keys(data);
        if (!Array.isArray) {
          data = [];
        }
      } catch (error) {}
      return this.saveSortedId(data);
    });
  }

  saveTranslatedFile(file: any): Promise<void> {
    return writeFile(this.targetInfo.autoTargetFile!, new Uint8Array(file.buffer), {
      encoding: 'utf-8',
    });
  }

  restart() {
    process.exit(0);
  }

  saveSortedId(data: Array<string>) {
    const path = join(this._targetPathBuilder.getTargetDirectory(), 'sorted.json');
    return readFile(path, { encoding: 'utf-8' })
      .catch(() => {
        return '[]';
      })
      .then((dataString) => {
        let list: string[] = [];
        try {
          list = JSON.parse(dataString);
          if (!Array.isArray(list)) {
            list = [];
          }
        } catch (error) {
          console.log(error, '读取排序文件错误, 将新建文件!');
        }
        const dataList = Array.isArray(data) ? data.filter(Boolean) : [];
        const resultList = Array.from(new Set(list.concat(dataList)));
        return writeFile(path, JSON.stringify(resultList, undefined, 4), { encoding: 'utf-8' });
      });
  }

  getSortedId() {
    const path = join(this._targetPathBuilder.getTargetDirectory(), 'sorted.json');
    return readFile(path, { encoding: 'utf-8' }).then((dataString) => {
      let list: string[] = [];
      try {
        list = JSON.parse(dataString);
        if (!Array.isArray(list)) {
          list = [];
        }
        return list;
      } catch (error) {
        console.log(error, '读取排序文件错误, 返回结果不排序!');
      }
    });
  }
}
