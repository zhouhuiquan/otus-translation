import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ReplaySubject, filter } from 'rxjs';

export const fileFormats = ['Excel', 'Json'] as const;
export type fileFormats = (typeof fileFormats)[number];

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  fileFormat = new ReplaySubject<fileFormats>(1);

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const fileFormat = this.router.url.split('/')[1];
      if (fileFormat) {
        const [firstLetter, ...rest] = fileFormat;
        this.fileFormat.next(`${firstLetter.toUpperCase()}${rest.join('')}` as fileFormats);
      }
    });
  }

  setFileFormat(value: fileFormats) {
    this.router.navigateByUrl(`/${value.toLowerCase()}`);
  }
}
