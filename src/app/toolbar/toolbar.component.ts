import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
    @Output() destroy = new EventEmitter<void>();
}
