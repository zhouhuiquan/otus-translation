import { exec } from 'child_process';

import { Injectable } from '@nestjs/common';

import { TargetInfo } from '../target-info';

function paddingZero(num: number): string {
  if (num > 9) {
    return `${num}`;
  }
  return `0${num}`;
}

@Injectable()
export class GitService {
  constructor(private _targetInfo: TargetInfo) {}

  // changeDirectory() {
  //   exec(`cd ${this._targetInfo.project}`, (error) => {
  //     if (error) {
  //       console.error(error);
  //     }
  //   })
  // }

  commitHandler(): Promise<any> {
    const promise = new Promise<void>((resolve, reject) => {
      exec(`git add ${this._targetInfo.autoTargetFile}`, (err) => {
        if (!err) {
          const date = new Date();
          const year = date.getFullYear();
          const month = paddingZero(date.getMonth() + 1);
          const day = paddingZero(date.getDate());
          const hour = paddingZero(date.getHours());
          const minute = paddingZero(date.getMinutes());
          const second = paddingZero(date.getSeconds());
          const dateString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
          exec('git diff --cached --name-only', (error, fileNameList) => {
            if (!error) {
              if (fileNameList) {
                exec(
                  `git commit -m "localization: localized at ${dateString}" --no-verify`,
                  (e) => {
                    if (!e) {
                      const commitDateString = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
                      exec(`git push origin HEAD:localization/${commitDateString}`, (err) => {
                        if (!err) {
                          resolve();
                        } else {
                          console.log(err);
                          reject(err);
                        }
                      });
                    } else {
                      console.log(e);
                      reject(e);
                    }
                  }
                );
              }
              resolve();
            } else {
              console.log(error);
              reject(error);
            }
          });
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
    return promise;
  }
}
