import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
    OpenReferenceRequest,
    Session,
    SessionDocument,
    SessionReference,
    SessionSignature,
} from '@ekisa-xsighub/core';
import { randAvatar, randCountry, randEmail, randFullName, randRole } from '@ngneat/falso';
import { marked } from 'marked';
import { XsighubService } from 'src/app/xsighub.service';
import { DOC_1 } from '../docs/doc1';
import { DOC_2 } from '../docs/doc2';
import { DOC_3 } from '../docs/doc3';
import { DOC_4 } from '../docs/doc4';
import { DOC_5 } from '../docs/doc5';

@Component({
    selector: 'app-reference-documents',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reference-documents.component.html',
})
export class ReferenceDocumentsComponent {
    @Input({ required: true }) session!: Session;

    @Output() createReference = new EventEmitter<SessionReference>();
    @Output() deleteReference = new EventEmitter<number>();
    @Output() openReference = new EventEmitter<OpenReferenceRequest>();

    private readonly _sanitizer = inject(DomSanitizer);
    private readonly _xsighubService = inject(XsighubService);

    get documentReferences(): SessionReference[] {
        return this.session?.references?.filter((ref) => ref.type === 'document') ?? [];
    }

    get templates(): SessionReference[] {
        const generatedTemplates: SessionReference[] = [];

        const templatesNames: Record<string, string> = {
            doc1: 'Consentimientos informados',
            doc2: 'Ejercicios de terapia física',
            doc3: 'Historial médico',
            doc4: 'Instrucciones de la receta',
            doc5: 'Resultados de exámenes de laboratorio',
        };

        const placeholders: Record<string, string> = {
            doc1: DOC_1,
            doc2: DOC_2,
            doc3: DOC_3,
            doc4: DOC_4,
            doc5: DOC_5,
        };

        for (const key of Object.keys(templatesNames)) {
            const referenceName = templatesNames[key];

            generatedTemplates.push({
                id: this._findReferenceId(referenceName),
                type: 'document',
                name: referenceName,
                documentPlaceholder: placeholders[key],
                signatures: this._findReferenceSignatures(referenceName),
                documents: this._findReferenceDocuments(referenceName),
                sessionId: this.session.id,
            });
        }

        return generatedTemplates;
    }

    isPreviewOpened = true;

    parseMetadata = (metadata: string) => JSON.stringify(JSON.parse(metadata), undefined, 2);

    parseMarkdown = (rawContent: string, metadata: string) => {
        const content = this._xsighubService.client.documents.populateMetadata(rawContent, {
            ingest: JSON.parse(metadata || '{}'),
        });

        const parsed = marked.parse(content, { async: false });

        return this._sanitizer.bypassSecurityTrustHtml(parsed as string);
    };

    extractSignatures(rawContent: string): {
        current: number;
        total: number;
        entries: [string, string][];
    } {
        const signatures = this._xsighubService.client.documents.extractSignatures(rawContent);
        const entries = Object.entries(signatures);

        return {
            current: entries.filter((entry) => !!entry[1]).length,
            total: entries.length,
            entries,
        };
    }

    trackByTemplate(_index: number, template: SessionReference) {
        return template.id;
    }

    trackByDocument(_index: number, document: SessionDocument) {
        return document.id;
    }

    async handleReferenceOpening(template: SessionReference, document?: SessionDocument) {
        const referenceId = this._findReferenceId(template.name);

        if (document) {
            this.openReference.emit({
                kind: 'document',
                sessionId: this.session.id,
                referenceId,
                documentId: document.id,
            });
        } else {
            const { id: documentId } = await this._xsighubService.client.documents.create({
                referenceId,
                rawContent: template.documentPlaceholder ?? '',
            });

            await this._xsighubService.client.documents.loadMetadata(documentId, {
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

            this.openReference.emit({
                kind: 'document',
                sessionId: this.session.id,
                referenceId,
                documentId,
            });
        }
    }

    private _findReferenceId(name: string): number {
        return this.session.references?.find((ref) => ref.name === name)?.id ?? 0;
    }

    private _findReferenceSignatures(name: string): SessionSignature[] {
        return this.session.references?.find((ref) => ref.name === name)?.signatures ?? [];
    }

    private _findReferenceDocuments(name: string): SessionDocument[] {
        return this.session.references?.find((ref) => ref.name === name)?.documents ?? [];
    }
}
