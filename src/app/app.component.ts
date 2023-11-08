import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarModule,
  MatSnackBarRef,
  SimpleSnackBar,
} from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';

import { CommonService } from './core/common.service';
import { WebsocketService } from './core/websocket.service';

@Component({
  selector: 't9n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterOutlet,
    MatProgressSpinnerModule,
  ],
})
export class AppComponent {
  @HostBinding('class.service-down') serviceDown = false;

  fileFormat = new BehaviorSubject('/').pipe();

  constructor(
    websocketService: WebsocketService,
    snackbar: MatSnackBar,
    public common: CommonService
  ) {
    let snackbarRef: MatSnackBarRef<SimpleSnackBar>;
    websocketService.project.subscribe((p) => {
      if (!this.serviceDown && !p) {
        snackbarRef = snackbar.open(
          `Translation server is not available. Start it by running the command 'ng run yourProject:t9n' in your console.`
        );
      } else if (this.serviceDown && p) {
        snackbarRef?.dismiss();
      }

      this.serviceDown = !p;
    });
    this.fileFormat = this.common.fileFormat.pipe(map((value) => value.toLowerCase()));
  }
}
