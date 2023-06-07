import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SocketIoModule } from 'ngx-socket-io';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment.development';

bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(),
        importProvidersFrom([
            SocketIoModule.forRoot({
                url: environment.xsighub.socketIO.namespaces.sessions,
            }),
        ]),
    ],
}).catch((error) => console.error(error));
