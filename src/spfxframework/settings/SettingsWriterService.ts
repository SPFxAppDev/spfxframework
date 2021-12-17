import { ServiceKey, ServiceScope } from '@microsoft/sp-core-library';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { PageContext } from '@microsoft/sp-page-context';
import { clearLocalCache } from '@spfxappdev/storage';
import { extend, isNullOrEmpty, issetDeep } from '@spfxappdev/utility';
import { SPUri, Uri } from '../utility/UrlHelper';
import { SPfxAppDevConfiguration } from '../config/Configuration';
import { ISettings } from './ISettings.interface';
import { Logger, LogType } from '@spfxappdev/logger';


export interface ISettingsWriterService {
    setSettings<T = ISettings>(key: string, settings: T): Promise<T>
}

export class SettingsWriterService implements ISettingsWriterService {

    public static readonly serviceKey: ServiceKey<ISettingsWriterService> =
        ServiceKey.create<SettingsWriterService>('SPFxAppDev:ISettingsWriterService', SettingsWriterService);

    private spHttpClient: SPHttpClient;
    private pageContext: PageContext;

    private get webAndSiteKey(): string {
        const siteId = this.pageContext.site.id.toString().replace(/[^\w\s]/gi, '');
        const webId = this.pageContext.web.id.toString().replace(/[^\w\s]/gi, '');
        return `${siteId}_${webId}`;
    }

    constructor(serviceScope: ServiceScope) {
        serviceScope.whenFinished(() => {
            this.spHttpClient = serviceScope.consume(SPHttpClient.serviceKey);
            this.pageContext = serviceScope.consume(PageContext.serviceKey);
        });
    }

    @clearLocalCache({
        key(key: string, defaultSettings: any, refreshCache: boolean): string {
            return (this as SettingsWriterService).getCacheKey(key);
        }
    })
    public setSettings<T = ISettings>(key: string, settings: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if(issetDeep(window, `SPFxAppDevSettings.${this.webAndSiteKey}.${key}`)) {
                delete (window as any).SPFxAppDevSettings[this.webAndSiteKey][key];
            }
            
            this.setSettingsToLibrary(this.pageContext.site.serverRelativeUrl, key, settings).then((savedSettings: T) => {
                return resolve(savedSettings);
            });

        });
    }

    private getCacheKey(key: string): string {
        const webAndSiteKey = this.webAndSiteKey;
        return `${webAndSiteKey}_${key}`;
    }

    private log(...val: any[]): void {
        Logger.Log("SettingsReaderService", LogType.Log, ...val);
    }

    private setSettingsToLibrary<T>(serverRelativeWebUrl: string, key: string, settings: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            if(isNullOrEmpty(SPfxAppDevConfiguration.settingsListUrl)) {
                this.log("The settings list does not set, skip save settings in library");
                return resolve(settings);
            }

            const spUrlhelper: SPUri = new SPUri(this.pageContext);
            const webAppUrl: string = spUrlhelper.GetWebAppUrl();
            const urlhelper: Uri = new Uri(webAppUrl);
            urlhelper.Combine(serverRelativeWebUrl);
            urlhelper.Combine(`_api/web/getlist('${this.getListEndpoint(serverRelativeWebUrl)}')/RootFolder/Files/Add(url='${key}.json', overwrite=true)`);
            let endpoint: string = urlhelper.toString();
            
            this.spHttpClient.post(endpoint, SPHttpClient.configurations.v1, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settings)
            }).then((response: SPHttpClientResponse) => {

                response.json().then((settings: T) => {
                    return resolve(extend(settings, settings));
                }).catch((error) => {
                    return resolve(extend(settings, {}));
                });
            }).catch((error) => {
                return resolve(extend(settings, {}));
            });
        });
    }

    private getListEndpoint(settingsSiteUrl: string): string {
        //TODO: EDIT ==> URL Helper
        return settingsSiteUrl + '/' + SPfxAppDevConfiguration.settingsListUrl;
    }
}