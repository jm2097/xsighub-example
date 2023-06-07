import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Session } from '@ekisa-xsighub/core';

@Component({
    selector: 'app-connection-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './connection-info.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionInfoComponent {
    @Input({ required: true }) session!: Session;
}
