import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';

import { TranslationTargetUnitResponse } from '../../../models';

import { TranslationTargetService } from './translation-target.service';

@Injectable()
export class ExportService {
  constructor(
    private _translationTargetService: TranslationTargetService,
    private http: HttpClient
  ) {}

  export(config: { state: string }): Observable<void> {
    return this._translationTargetService.target.pipe(
      take(1),
      switchMap((t) =>
        this._fetchUnits().pipe(
          map((entries) =>
            entries.map(({ id, description, meaning, source, target }) => ({
              Id: id,
              Description: description,
              Meaning: meaning,
              Source: source,
              Target: target,
            }))
          ),
          switchMap(async (entries) => {
            const { utils, writeFile } = await import('xlsx');
            const header = ['Id', 'Description', 'Meaning', 'Source', 'Target'];
            const sheet = utils.json_to_sheet(entries, { header });
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, sheet, t.language);
            writeFile(workbook, `t9n-${t.language}-${config.state || 'all'}.xlsx`);
          })
        )
      )
    );
  }

  exportJson(config: { state: string }): Observable<any> {
    return this._translationTargetService.target.pipe(
      take(1),
      switchMap((t) => {
        return this._fetchUnits().pipe(
          take(1),
          map((entries) => {
            if (config.state === '') {
              return Object.fromEntries(entries.map((item) => [item.id, item.target]));
            }
            return Object.fromEntries(
              entries
                .filter((item) => item.state === config.state)
                .map((item) => [item.id, item.target])
            );
          }),
          map((obj: Record<string, string>) => {
            let ids;
            try {
              ids = JSON.parse(localStorage.getItem('ids') || '[]');
              if (!Array.isArray(ids)) {
                ids = [];
              }
            } catch (error) {
              ids = [];
            }
            const existData = Object.fromEntries(ids.map((item) => [item, obj[item]]));
            const addedData = Object.fromEntries(
              Object.entries(obj).filter((item) => !(item[0] in existData))
            );
            return { ...existData, ...addedData };
          }),
          switchMap((object) => {
            const blob = new Blob([JSON.stringify(object, null, 2)], {});
            saveAs(blob, `messages.${t.language}.json`);
            return Promise.resolve();
          })
        );
      })
    );
  }

  exportJsonFile() {
    return this._translationTargetService.target.pipe(
      take(1),
      switchMap(() => {
        return this._fetchUnits().pipe(
          take(1),
          map((entries) => {
            return Object.fromEntries(
              entries
                .filter((item) => item.state === 'translated')
                .map((item) => [item.id, item.target])
            );
          }),
          map((obj: Record<string, string>) => {
            let ids;
            try {
              ids = JSON.parse(localStorage.getItem('ids') || '[]');
              if (!Array.isArray(ids)) {
                ids = [];
              }
            } catch (error) {
              ids = [];
            }
            const existData = Object.fromEntries(ids.map((item) => [item, obj[item]]));
            const addedData = Object.fromEntries(
              Object.entries(obj).filter((item) => !(item[0] in existData))
            );
            return { ...existData, ...addedData };
          }),
          switchMap((object) => {
            const blob = new Blob([JSON.stringify(object, null, 2)], {});
            const form = new FormData();
            form.append('file', blob);
            return this.http.post('http://localhost:4300/api/targets/saveTranslatedFile', form, {});
          })
        );
      }),
      catchError((err) => {
        throw err;
      })
    );
  }

  private _fetchUnits(page = 0): Observable<TranslationTargetUnitResponse[]> {
    return this._translationTargetService
      .units({ page, entriesPerPage: 250 })
      .pipe(
        switchMap((pageResponse) =>
          pageResponse._links!.next
            ? this._fetchUnits(++page).pipe(
                map((entries) => pageResponse._embedded.entries.concat(entries))
              )
            : of(pageResponse._embedded.entries)
        )
      );
  }
}
