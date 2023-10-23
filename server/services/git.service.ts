import { exec } from 'child_process';

import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

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

  commitHandler(): Observable<any> {
    const observable = new Observable<any>((sub) => {
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
                sub.next();
              }
              sub.error(err);
            }
          );
        } else {
          console.log(err);
          sub.error(err);
        }
        sub.complete();
      });
    });
    return observable;
  }
}
