import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Session, SessionReference } from '@ekisa-xsighub/core';

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

    get standaloneReference(): SessionReference | undefined {
        return this.session?.references?.find((ref) => ref.type === 'standalone');
    }
}
