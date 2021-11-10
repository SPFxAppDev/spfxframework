import { ServiceKey, ServiceScope } from '@microsoft/sp-core-library';
import { SPHttpClient } from '@microsoft/sp-http';
import { PageContext } from '@microsoft/sp-page-context';
import { Promise } from 'es6-promise';
import { isNullOrEmpty } from '@spfxappdev/utility';

export interface IBootLoaderService {
    getPageContext(): PageContext;
    getSPHttpClient(): SPHttpClient;
    getServiceScope(): ServiceScope;
    onLoad(promises: Array<Promise<void>>): Promise<void>;
}

export class BootLoaderService implements IBootLoaderService {

    public static readonly serviceKey: ServiceKey<IBootLoaderService> =
        ServiceKey.create<BootLoaderService>('SPFxAppDev:IBootLoaderService', BootLoaderService);

    private spHttpClient: SPHttpClient;
    private pageContext: PageContext;

    constructor(private serviceScope: ServiceScope) {
        serviceScope.whenFinished(() => {
            this.spHttpClient = serviceScope.consume(SPHttpClient.serviceKey);
            this.pageContext = serviceScope.consume(PageContext.serviceKey);

            (window as any).SPFxAppDevBootloader = (window as any).SPFxAppDevBootloader || {};
            (window as any).SPFxAppDevBootloader.pageContext = this.pageContext;
        });
    }

    public getPageContext(): PageContext {
        return this.pageContext;
    }

    public getSPHttpClient(): SPHttpClient {
        return this.spHttpClient;
    }

    public getServiceScope(): ServiceScope {
        return this.serviceScope;
    }

    public onLoad(promises: Array<Promise<void>>): Promise<void> {
        
        if(isNullOrEmpty(promises)) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            Promise.all(promises).then(() => {
                return resolve();
            });
        });
    }

    // public setConsoleProperties(props: IConsoleLoggingEnabled): void {
    //     (window as any).SPFxAppDevBootloader.EnableConsoleLogging = props;
    //     Logger.DefaultSettings.LoggingEnabled = props;
    // }
}