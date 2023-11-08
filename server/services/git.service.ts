import { exec as _exec } from 'child_process';
import util from 'util';

import { Injectable } from '@nestjs/common';

import { TargetInfo } from '../target-info';

function paddingZero(num: number): string {
  if (num > 9) {
    return `${num}`;
  }
  return `0${num}`;
}

export const exec = util.promisify(_exec);

@Injectable()
export class GitService {
  constructor(private _targetInfo: TargetInfo) {}

  commitHandler(): Promise<any> {
    const date = new Date();
    const year = date.getFullYear();
    const month = paddingZero(date.getMonth() + 1);
    const day = paddingZero(date.getDate());
    const hour = paddingZero(date.getHours());
    const minute = paddingZero(date.getMinutes());
    const second = paddingZero(date.getSeconds());
    const dateString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

    return exec(`git add ${this._targetInfo.autoTargetFile}`)
      .then(() => {
        return exec('git diff --cached --name-only');
      })
      .then((filsList) => {
        if (filsList) {
          return Promise.reject('文件已经存在');
        }
        return exec(`git commit -m "localization: localized at ${dateString}" --no-verify`);
      })
      .then(() => {
        const commitDateString = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
        return exec(`git push origin HEAD:localization/${commitDateString}`);
      })
      .catch((err) => {
        if (err === '文件已经存在') {
          return;
        }
        return Promise.reject(err);
      });
  }

  syncLocalizationToDesktop() {
    return exec(
      `git show head:apps/otus-app/src/assets/translations/messages.zh-CN.json > ../messages.zh-CN.json`
    )
      .then(() => {
        return exec(
          `scp ../messages.zh-CN.json otus_public@192.168.31.206:data/otus-front_end/nginx-1.25.3/html/assets/translations/`
        );
      })
      .then(() => {
        return exec(`rm ../messages.zh-CN.json`);
      });
  }
}
