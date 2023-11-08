import { NgIf, AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject, switchMap, take, takeUntil } from 'rxjs';

import { CommonService } from '../../core/common.service';
import { ExportService } from '../core/export.service';

@Component({
  selector: 't9n-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExportService],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    NgIf,
    MatProgressSpinnerModule,
    AsyncPipe,
    MatSnackBarModule,
  ],
})
export class ExportComponent implements OnDestroy {
  configuration: UntypedFormGroup;
  loading = new BehaviorSubject(false);
  destroy$ = new Subject();

  constructor(
    private _exportService: ExportService,
    formBuilder: UntypedFormBuilder,
    public common: CommonService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.configuration = formBuilder.group({
      state: 'translated',
    });
  }

  export() {
    this.loading.next(true);
    this.common.fileFormat
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        switchMap((format) => {
          if (format === 'Excel') {
            return this._exportService.export(this.configuration.value);
          }
          return this._exportService.exportJson(this.configuration.value);
        })
      )
      .subscribe(() => {
        this.loading.next(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  updateHandler() {
    this.common.loading$.next(true);
    this._exportService.exportJsonFile().subscribe({
      next: (res: any) => {
        if (!res.code) {
          this.snackBar.open('Update Successs', '', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 2000,
          });
        } else {
          this.snackBar.open('Update Failed', 'ERROR', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000,
          });
        }
      },
      error: (error) => {
        console.log(error);
        this.snackBar.open('Update Failed', 'ERROR', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 3000,
        });
        this.common.loading$.next(false);
      },
      complete: () => {
        this.common.loading$.next(false);
      },
    });
  }

  commitHandler() {
    this.common.loading$.next(true);
    this.http.get('/api/targets/gitCommit').subscribe({
      next: (res: any) => {
        if (!res.code) {
          this.snackBar.open('提交成功', '', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 2000,
          });
        } else {
          this.snackBar.open('Commit Failed', 'ERROR', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000,
          });
        }
      },
      error: (error) => {
        console.log(error);
        this.snackBar.open('Commit Failed', 'ERROR', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 3000,
        });
        this.common.loading$.next(false);
      },
      complete: () => {
        this.common.loading$.next(false);
      },
    });
  }

  syncHandler() {
    this.common.loading$.next(true);
    this.http.get('/api/targets/syncLocalization').subscribe({
      next: (res: any) => {
        if (!res.code) {
          this.snackBar.open('同步成功', '', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 2000,
          });
        } else {
          this.snackBar.open('Sync Failed', 'ERROR', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000,
          });
        }
      },
      error: (error) => {
        console.log(error);
        this.snackBar.open('Sync Failed', 'ERROR', {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 3000,
        });
        this.common.loading$.next(false);
      },
      complete: () => {
        this.common.loading$.next(false);
      },
    });
  }
}
