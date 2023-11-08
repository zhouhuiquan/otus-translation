import { NgIf, NgFor, AsyncPipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, HostListener } from '@angular/core';
import { UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, switchMap, take, tap } from 'rxjs';

import { CommonService } from '../../core/common.service';
import { ImportResult } from '../core/import-result';
import { ImportService } from '../core/import.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 't9n-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImportService],
  standalone: true,
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatButtonModule,
    NgIf,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatListModule,
    NgFor,
    AsyncPipe,
    LowerCasePipe,
    MatSnackBarModule,
  ],
})
export class ImportComponent {
  @HostBinding('class.dragging') dragging = false;
  importing = new BehaviorSubject(false);
  importResult = new BehaviorSubject<ImportResult | undefined>(undefined);
  targetState = new UntypedFormControl('translated');

  constructor(
    private _importService: ImportService,
    public common: CommonService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  @HostListener('dragover', ['$event']) onDragOver(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = false;
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = false;
    if (event.dataTransfer?.files.length) {
      this._import(event.dataTransfer.files);
    }
  }

  onInput(event: Event) {
    if ((event?.target as HTMLInputElement)?.files) {
      this._import((event.target as HTMLInputElement).files!);
    }
  }

  private async _import(files: FileList) {
    this.importResult.next(undefined);
    this.importing.next(true);
    this.common.fileFormat
      .pipe(
        take(1),
        switchMap((fileFormat) => {
          if (fileFormat === 'Excel') {
            return this._importService.import(files, this.targetState.value);
          }
          return this._importService.importJson(files, this.targetState.value);
        })
      )
      .subscribe({
        next: (value) => {
          this.importResult.next(value);
        },
        complete: () => {
          this.importing.next(false);
        },
      });
  }

  loadFile() {
    this.http
      .get('http://localhost:4300/api/targets/loadTranslatedFile', { responseType: 'arraybuffer' })
      .pipe(
        tap(() => {
          this.common.loading$.next(true);
        })
      )
      .subscribe({
        next: (data) => {
          const fileList = [new File([data], 'target.json')];
          this._importService
            .importJson(fileList, 'translated')
            .then(() => {
              this.snackBar.open('Load Success', '', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 2000,
              });
            })
            .catch(() => {
              this.snackBar.open('Load Failed', 'ERROR', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 3000,
              });
            });
        },
        error: () => {
          this.snackBar.open('Load Failed', 'ERROR', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000,
          });
        },
      });
  }
}
