import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import {
    Session,
    SessionDocument,
    SessionReference,
    SessionSignature,
    __sessionSocketEvents__,
} from '@ekisa-xsighub/core';
import { client } from '@ekisa-xsighub/sdk';
import { randAvatar, randCountry, randEmail, randFullName, randRole } from '@ngneat/falso';
import { Socket } from 'ngx-socket-io';
import { map, tap } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { ConnectionInfoComponent } from './connection-info/connection-info.component';
import { QrViewComponent } from './qr-view/qr-view.component';
import { ReferencesComponent } from './references/references.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

type SocketEvent = {
    message: string;
    session: Session;
    source?: 'session' | 'reference' | 'signature' | 'document';
    action?: 'create' | 'update' | 'delete';
    data?: Session | SessionReference | SessionSignature | SessionDocument;
};

const COMPONENTS = [
    ToolbarComponent,
    QrViewComponent,
    ReferencesComponent,
    ConnectionInfoComponent,
] as const;

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, ...COMPONENTS],
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    @ViewChild('qrContainer') qrContainer!: ElementRef<HTMLDivElement>;

    private readonly _socket = inject(Socket);

    private readonly _sdk = client.init({
        api: environment.xsighub.api,
        version: environment.xsighub.version,
    });

    pairingKey = signal<string | null>(null);

    session = signal<Session | null>(null);

    constructor() {
        effect(
            () => {
                const session = this.session();

                session ? this.pairingKey.set(session.pairingKey) : this.pairingKey.set(null);
            },
            {
                allowSignalWrites: true,
            },
        );
    }

    ngOnInit(): void {
        this._sdk.sessions
            .findByIpAddress()
            .then((session) => this.session.set(session))
            .catch(console.warn);

        this._setupSocketEvents();
    }

    createSession = () => this._sdk.sessions.create().catch(alert);

    destroySession = () => this._sdk.sessions.destroy().catch(alert);

    handleCreateReference(reference: SessionReference): void {
        this._sdk.references.create({
            type: reference.type,
            name: reference.name,
            documentPlaceholder: reference.documentPlaceholder,
            sessionId: reference.sessionId,
        });
    }

    handleDeleteReference(referenceId: number): void {
        if (
            confirm(
                'Si se elimina una referencia, se pierden todas las firmas y documentos asociados. ¿Desea continuar?',
            )
        ) {
            this._sdk.references.delete(referenceId);
        }
    }

    private _setupSocketEvents(): void {
        [
            __sessionSocketEvents__.created,
            __sessionSocketEvents__.paired,
            __sessionSocketEvents__.unpaired,
        ].forEach((event) =>
            this._socket
                .fromEvent<SocketEvent>(event)
                .pipe(
                    tap(({ session, message }) => console.log(message, { session })),
                    map(({ session }) => session),
                )
                .subscribe(this.session.set),
        );

        this._socket
            .fromEvent<SocketEvent>(__sessionSocketEvents__.updated)
            .pipe(tap(({ message }) => console.log(message)))
            .subscribe(({ session, source, action, data }) => {
                this.session.set(session);

                if (source === 'document' && action === 'create' && data) {
                    client.documents.loadMetadata(data.id, {
                        ingest: {
                            paciente: randFullName(),
                            pacienteAvatar: randAvatar(),
                            pacientePais: randCountry(),
                            acudiente: randFullName({ gender: 'female' }),
                            acudienteAvatar: randAvatar(),
                            acudienteEmail: randEmail(),
                            medico: randFullName(),
                            medicoAvatar: randAvatar(),
                            medicoRol: randRole(),
                        },
                    });
                }
            });

        this._socket
            .fromEvent<SocketEvent>(__sessionSocketEvents__.destroyed)
            .pipe(tap(({ message }) => console.log(message)))
            .subscribe(() => this.session.set(null));
    }
}
