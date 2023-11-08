import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import {
    OpenReferenceRequest,
    Session,
    SessionDocument,
    SessionReference,
    SessionSignature,
    __serverEvents__,
    __webEvents__,
} from '@ekisa-xsighub/core';
import { randAvatar, randCountry, randEmail, randFullName, randRole } from '@ngneat/falso';
import { Socket } from 'ngx-socket-io';
import { filter, map, tap } from 'rxjs';
import { ConnectionInfoComponent } from './connection-info/connection-info.component';
import { QrViewComponent } from './qr-view/qr-view.component';
import { ReferencesComponent } from './references/references.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { XsighubService } from './xsighub.service';

type SocketEvent = {
    message: string;
    session: Session;
    source?: 'session' | 'reference' | 'signature' | 'document';
    action?: 'create' | 'update' | 'delete';
    data?: Session | SessionReference | SessionSignature | SessionDocument;
};

const COMPONENTS = [ToolbarComponent, QrViewComponent, ReferencesComponent, ConnectionInfoComponent] as const;

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, ...COMPONENTS],
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    @ViewChild('qrContainer') qrContainer!: ElementRef<HTMLDivElement>;

    private readonly _socket = inject(Socket);
    private readonly _xsighubService = inject(XsighubService);

    pairingKey = signal<string | null>(localStorage.getItem('pairingKey'));
    session = signal<Session | null>(null);
    sessionInstanceInteracted = signal(false);

    constructor() {
        effect(
            () => {
                const session = this.session();

                if (session) {
                    this.pairingKey.set(session.pairingKey);
                    localStorage.setItem('pairingKey', session.pairingKey);
                }
            },
            {
                allowSignalWrites: true,
            },
        );
    }

    ngOnInit(): void {
        const pairingKey = this.pairingKey();

        if (pairingKey) {
            this._xsighubService.client.sessions
                .findByPairingKey(pairingKey)
                .then((session) => this.session.set(session))
                .catch((error) => {
                    console.warn(error);
                    this._cleanupSession();
                });
        }

        this._setupSocketEvents();
    }

    createSession = () => {
        this.sessionInstanceInteracted.set(true);
        this._xsighubService.client.sessions.create().catch(console.error);
    };

    destroySession = () =>
        this._xsighubService.client.sessions
            .destroy(this.pairingKey() ?? '')
            .then(() => this._cleanupSession())
            .catch(console.error);

    createReference(reference: SessionReference): void {
        this._xsighubService.client.references.create({
            type: reference.type,
            name: reference.name,
            documentPlaceholder: reference.documentPlaceholder,
            sessionId: reference.sessionId,
        });
    }

    deleteReference(referenceId: number): void {
        if (
            confirm(
                'Si se elimina una referencia, se pierden todas las firmas y documentos asociados. ¿Desea continuar?',
            )
        ) {
            this._xsighubService.client.references.delete(referenceId);
        }
    }

    openReference(request: OpenReferenceRequest): void {
        this._socket.emit(__webEvents__.openReference, request);
    }

    private _cleanupSession(): void {
        this.session.set(null);
        this.pairingKey.set(null);
        localStorage.removeItem('pairingKey');
    }

    private _setupSocketEvents(): void {
        [__serverEvents__.sessionCreated, __serverEvents__.sessionPaired, __serverEvents__.sessionUnpaired].forEach(
            (event) =>
                this._socket
                    .fromEvent<SocketEvent>(event)
                    .pipe(
                        tap(({ session, message }) => console.log(message, { session })),
                        map(({ session }) => session),
                    )
                    .subscribe((session) => {
                        if (this.sessionInstanceInteracted()) {
                            this.session.set(session);
                            this.sessionInstanceInteracted.set(false);
                        }
                    }),
        );

        this._socket
            .fromEvent<SocketEvent>(__serverEvents__.sessionUpdated)
            .pipe(tap(({ message }) => console.log(message)))
            .subscribe(({ session, source, action, data }) => {
                this.session.set(session);

                if (source === 'document' && action === 'create' && data) {
                    this._xsighubService.client.documents.loadMetadata(data.id, {
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
            .fromEvent<SocketEvent>(__serverEvents__.sessionDestroyed)
            .pipe(
                map(({ message }) => message.split(' ')[1]),
                filter((sessionId) => this.session()?.id === (sessionId as unknown as number)),
            )
            .subscribe(() => this.session.set(null));

        this._socket
            .fromEvent<SocketEvent>(__serverEvents__.referenceOpenedRequested)
            .pipe(tap(console.log))
            .subscribe();
    }
}
