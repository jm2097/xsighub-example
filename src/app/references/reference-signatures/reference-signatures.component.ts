import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OpenReferenceRequest, Session, SessionReference } from '@ekisa-xsighub/core';

@Component({
    selector: 'app-reference-signatures',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reference-signatures.component.html',
})
export class ReferenceSignaturesComponent {
    @Input({ required: true }) session!: Session;

    @Output() createReference = new EventEmitter<void>();
    @Output() deleteReference = new EventEmitter<number>();
    @Output() openReference = new EventEmitter<OpenReferenceRequest>();

    get standaloneReference(): SessionReference | undefined {
        return this.session?.references?.find((ref) => ref.type === 'standalone');
    }

    handleReferenceOpening() {
        if (this.standaloneReference?.id) {
            this.openReference.emit({
                kind: 'standalone',
                sessionId: this.session.id,
                referenceId: this.standaloneReference.id,
            });
        }
    }
}
