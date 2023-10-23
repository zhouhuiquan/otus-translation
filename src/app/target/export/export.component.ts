import { NgIf, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
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
  ],
})
export class ExportComponent implements OnDestroy {
  configuration: UntypedFormGroup;
  loading = new BehaviorSubject(false);
  destroy$ = new Subject();

  constructor(
    private _exportService: ExportService,
    formBuilder: UntypedFormBuilder,
    public common: CommonService
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
}
