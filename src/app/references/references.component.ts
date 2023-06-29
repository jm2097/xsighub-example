import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OpenReferenceRequest, Session, SessionReference } from '@ekisa-xsighub/core';
import { ReferenceDocumentsComponent } from './reference-documents/reference-documents.component';
import { ReferenceSignaturesComponent } from './reference-signatures/reference-signatures.component';

@Component({
    selector: 'app-references',
    standalone: true,
    imports: [CommonModule, ReferenceSignaturesComponent, ReferenceDocumentsComponent],
    templateUrl: './references.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferencesComponent {
    @Input({ required: true }) session!: Session;

    @Output() createReference = new EventEmitter<SessionReference>();
    @Output() deleteReference = new EventEmitter<SessionReference['id']>();
    @Output() openReference = new EventEmitter<OpenReferenceRequest>();

    handleReferenceCreation(reference?: SessionReference): void {
        let newReference: SessionReference = {
            id: 0,
            type: 'standalone',
            name: 'Standalone Ref',
            sessionId: this.session.id,
        };

        if (reference) {
            newReference = structuredClone(reference);
        }

        this.createReference.emit(newReference);
    }

    handleReferenceDeletion(referenceId: SessionReference['id']): void {
        this.deleteReference.emit(referenceId);
    }

    handleReferenceOpening(request: OpenReferenceRequest): void {
        this.openReference.emit(request);
    }
}
