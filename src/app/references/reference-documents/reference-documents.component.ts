import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Session, SessionDocument, SessionReference, SessionSignature } from '@ekisa-xsighub/core';
import { client } from '@ekisa-xsighub/sdk';
import { environment } from 'src/environments/environment.development';
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

    private readonly _sdk = client.init({
        api: environment.xsighub.api,
        version: environment.xsighub.version,
    });

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
