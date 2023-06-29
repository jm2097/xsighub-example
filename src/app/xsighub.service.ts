import { Injectable } from '@angular/core';
import { SdkClient, client } from '@ekisa-xsighub/sdk';
import { environment } from 'src/environments/environment.development';

@Injectable({ providedIn: 'root' })
export class XsighubService {
    private readonly _sdkClient = client.init({
        api: environment.xsighub.api,
        version: environment.xsighub.version,
    });

    get client(): SdkClient {
        return this._sdkClient;
    }
}
