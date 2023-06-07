import { CommonModule } from '@angular/common';
import {
    Component,
    ElementRef,
    Input,
    OnChanges,
    Renderer2,
    ViewChild,
    inject,
} from '@angular/core';
import { client } from '@ekisa-xsighub/sdk';
import { environment } from 'src/environments/environment.development';

@Component({
    selector: 'app-qr-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './qr-view.component.html',
})
export class QrViewComponent implements OnChanges {
    @Input({ required: true }) code!: string;

    @ViewChild('qrWrapper') qrWrapper!: ElementRef<HTMLDivElement>;

    private readonly _renderer = inject(Renderer2);

    private readonly _sdk = client.init({
        api: environment.xsighub.api,
        version: environment.xsighub.version,
    });

    async ngOnChanges(): Promise<void> {
        if (this.code) {
            if (this.qrWrapper?.nativeElement.hasChildNodes()) return;

            const qrCode = await this._sdk.qr.generate(this.code);

            this._renderer.appendChild(
                this.qrWrapper?.nativeElement,
                new DOMParser().parseFromString(qrCode, 'text/html').body.firstElementChild,
            );
        }
    }
}
