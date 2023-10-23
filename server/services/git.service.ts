import { exec } from 'child_process';

import { Injectable } from '@nestjs/common';

// import { TargetInfo } from '../target-info';

@Injectable()
export class GitService {
  // constructor(private _targetInfo: TargetInfo) {}

  // changeDirectory() {
  //   exec(`cd ${this._targetInfo.project}`, (error) => {
  //     if (error) {
  //       console.error(error);
  //     }
  //   })
  // }

  commitHandler(): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      exec('git add .', (err) => {
        if (!err) {
          const date = new Date();
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const hour = date.getHours();
          const minute = date.getMinutes();
          const second = date.getSeconds();
          exec(
            `git commit -m "localization: localized at ${year}-${month}-${day} ${hour}:${minute}:${second}"`,
            (e) => {
              if (!e) {
                resolve(true);
              }
              reject(e);
            }
          );
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
    return promise;
  }
}
