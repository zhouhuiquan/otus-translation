import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';

import { TranslationTargetUnitResponse } from '../../../models';

import { ImportResult } from './import-result';
import { TranslationTargetService } from './translation-target.service';

@Injectable()
export class ImportService {
  constructor(private _translationTargetService: TranslationTargetService) {}

  async import(files: FileList, state: 'translated' | 'reviewed' | 'final') {
    const { read, utils } = await import('xlsx');
    const result = new ImportResult();
    const unitRows = await Promise.all(
      Array.from(files).map(async (f) => {
        try {
          const binary = await this._readFileAsBinary(f);
          const workbook = read(binary, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = utils
            .sheet_to_json<string[]>(sheet, { header: 1 })
            .slice(1)
            .map((row) => this._toPartialTargetUnit(row))
            .filter((u) => u.id && u.target);
          if (!rows.length) {
            throw new Error(`${f.name} contains no valid units`);
          }

          return rows;
        } catch (e) {
          console.log(e);
          result.failedFiles.push(f.name);
          return [] as Partial<TranslationTargetUnitResponse>[];
        }
      })
    );
    await Promise.all(
      unitRows
        .reduce((current, next) => current.concat(next), [])
        .map(async (u) => {
          try {
            const response = (await this._importUnit(u, state).toPromise())!;
            result.importedUnits.push(response);
          } catch {
            result.failedUnits.push(u);
          }
        })
    );
    return result.sort();
  }

  private _readFileAsBinary(file: File) {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const bytes = new Uint8Array(event.target!.result as ArrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        resolve(binary);
      };
      reader.onerror = (event: ProgressEvent<FileReader>) => reject(event.target!.error);
      reader.onabort = () => reject();
      reader.readAsArrayBuffer(file);
    });
  }

  private _toPartialTargetUnit([
    id,
    description,
    meaning,
    source,
    target,
  ]: string[]): Partial<TranslationTargetUnitResponse> {
    return {
      id,
      description,
      meaning,
      source,
      target,
    };
  }

  private _importUnit(
    unit: Partial<TranslationTargetUnitResponse>,
    state: 'translated' | 'reviewed' | 'final'
  ) {
    return this._translationTargetService
      .unit(unit.id!)
      .pipe(
        switchMap((u) =>
          this._translationTargetService.updateUnit({ ...u, target: unit.target!, state })
        )
      );
  }

  async importJson(files: FileList, state: 'translated' | 'reviewed' | 'final') {
    const reader = new FileReader();
    const load = () =>
      new Promise((resolve) => {
        reader.addEventListener('loadend', (event) => {
          if (event.type === 'loadend') {
            resolve(JSON.parse(`${reader.result as string}`));
          }
        });
      });
    reader.readAsText(files[0]);
    const result = new ImportResult();

    const data = (await load()) as Object;

    const importIds: string[] = [];

    const all = Object.entries(data)
      .map((item) => ({
        id: item[0],
        target: item[1],
      }))
      .map(async (item) => {
        try {
          importIds.push(item.id);
          const response = (await this._importUnit(item, state).toPromise())!;
          result.importedUnits.push(response);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      });

    await Promise.all(all);

    let ids;

    try {
      ids = JSON.parse(localStorage.getItem('ids') || '[]');
      if (!Array.isArray(ids)) {
        ids = [];
      }
    } catch (error) {
      ids = [];
    }

    ids = Array.from(new Set([...ids, ...importIds]));
    localStorage.setItem('ids', JSON.stringify(ids));

    return result;
  }
}
