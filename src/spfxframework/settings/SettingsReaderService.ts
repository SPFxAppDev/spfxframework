import { ServiceKey, ServiceScope } from '@microsoft/sp-core-library';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { PageContext } from '@microsoft/sp-page-context';
import { clearLocalCache, localCache } from '@spfxappdev/storage';
import { isset, extend, isNullOrEmpty } from '@spfxappdev/utility';
import { SPUri, Uri } from '../utility/UrlHelper';
import { GeneralSettings, IGeneralSettings } from './';
import { settingsListUrl } from '../config/Configuration';


export interface ISettingsReaderService {
    getSettings<T = ISettings>(key: string, defaultSettings: T, refreshCache?: boolean): Promise<T>;
}

export interface ISettings {
    
}

interface ISettingsContainerKeyValue {
    key: string;
    IsLoaded: boolean;
    IsLoading: boolean;
    Settings: ISettings;
}

type ISettingsContainer = { [key: string]: ISettingsContainerKeyValue; };

type ISettingsWebAndSiteContainer = { [key: string]: ISettingsContainer; };

export class SettingsReaderService implements ISettingsReaderService {

    public static readonly serviceKey: ServiceKey<ISettingsReaderService> =
        ServiceKey.create<SettingsReaderService>('SPFxAppDev:ISettingsReaderService', SettingsReaderService);

    private spHttpClient: SPHttpClient;
    private pageContext: PageContext;
    private settingsWebAndSiteContainer: ISettingsWebAndSiteContainer;
    private settingsContainer: ISettingsContainer;
    private generalSettings: IGeneralSettings;

    private get webAndSiteKey(): string {
        const siteId = this.pageContext.site.id.toString().replace(/[^\w\s]/gi, '');
        const webId = this.pageContext.web.id.toString().replace(/[^\w\s]/gi, '');
        return `${siteId}_${webId}`;
    }

    constructor(serviceScope: ServiceScope) {
        serviceScope.whenFinished(() => {
            this.spHttpClient = serviceScope.consume(SPHttpClient.serviceKey);
            this.pageContext = serviceScope.consume(PageContext.serviceKey);
            (window as any).SPFxAppDevSettings = (window as any).SPFxAppDevSettings||{};
            this.settingsWebAndSiteContainer = (window as any).SPFxAppDevSettings as ISettingsWebAndSiteContainer;

            if(!isset(this.settingsWebAndSiteContainer[this.webAndSiteKey])) {
                this.settingsWebAndSiteContainer[this.webAndSiteKey] = {};
            }

            this.settingsContainer = this.settingsWebAndSiteContainer[this.webAndSiteKey] as ISettingsContainer;
            this.loadGeneralSettings();
        });
    }

    @clearLocalCache({
        key(key: string, defaultSettings: any, refreshCache: boolean): string {
            return (this as SettingsReaderService).getCacheKey(key);
        },
        when(key: string, defaultSettings: any, refreshCache: boolean): boolean {
            return refreshCache||false;
        }
    })
    @localCache({
        key(key: string, defaultSettings: any, refreshCache: boolean): string {
            return (this as SettingsReaderService).getCacheKey(key);
        } 
    })
    public getSettings<T = ISettings>(key: string, defaultSettings: T, refreshCache: boolean = false): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if(!isset(this.settingsContainer[key])) {
                this.settingsContainer[key] = {
                    IsLoaded: false,
                    IsLoading: false,
                    key: key,
                    Settings: null
                };
            }

            this.log(`SSC load settings with key: ${key}`);
            if (this.settingsContainer[key].IsLoading === false && this.settingsContainer[key].IsLoaded === false) {
                this.settingsContainer[key].IsLoading = true;
                this.log(`SSC wait while loading key '${key}' from SP`);
                this.getSettingsFromSite(key, defaultSettings).then((settings: T) => {
                    this.setInContainer(key, settings);
                    this.log([`SSC successfully loaded '${key}' from SP`, this.settingsContainer[key].Settings]);
                    return resolve(this.settingsContainer[key].Settings as T);
                });
            }
            else {
                const getterInterval: number = window.setInterval(() => {
                    this.log(`SSC wait while loading key '${key}' from first request`);
                    if (this.settingsContainer[key].IsLoaded) {
                        window.clearInterval(getterInterval);
                        const settingsValue: T = this.settingsContainer[key].Settings as T;
                        this.log([`SSC successfully loaded '${key}' from first request`, settingsValue]);
                        return resolve(settingsValue);
                    }
                }, 500);
            }
        });
    }

    private getCacheKey(key: string): string {
        const webAndSiteKey = this.webAndSiteKey;
        return `${webAndSiteKey}_${key}`;
    }

    private loadGeneralSettings(): Promise<IGeneralSettings> {
        return new Promise<IGeneralSettings>((resolve, reject) => {

            if(isset(this.generalSettings)) {
                return resolve(this.generalSettings);
            }

            this.getSettings(GeneralSettings.key, GeneralSettings.defaultSettings).then((settings: IGeneralSettings) => {
                this.generalSettings = settings;
                return resolve(this.generalSettings);
            });
        });
        
    }

    private setInContainer<T = ISettings>(key: string, settings: T): void {
        this.settingsContainer[key].IsLoading = false;
        this.settingsContainer[key].IsLoaded = true;
        this.settingsContainer[key].Settings = settings;
    }

    private log(val: any): void {
        console.log(val);
    }

    private getSettingsFromSite<T = ISettings>(key: string, defaultSettings: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            if(key == GeneralSettings.key) {
                this.getSettingsFromCurrentSite(key, defaultSettings).then((generalSettings: any) => {
                    const s = (generalSettings as IGeneralSettings).SettingsSourceSite;
                    const isInherited: boolean = !isNullOrEmpty(s.WebId) || !isNullOrEmpty(s.SiteId) || !isNullOrEmpty(s.ServerRelativeWebUrl);
                    if(!isInherited) {
                        return resolve(generalSettings as any as T);
                    }

                    this.getSettingsFromInhertitedSite(key, generalSettings.SettingsSourceSite.ServerRelativeWebUrl, defaultSettings).then((generalSettingsFromInheritedSite: T) => {
                        return resolve(generalSettingsFromInheritedSite);
                    });
                });
            }
            else {

                const self = this;
                const loadSettings = <TS = ISettings>(k: string, defSettings: TS): Promise<TS> => {
                    const s = self.generalSettings.SettingsSourceSite;
                    const isInherited: boolean = !isNullOrEmpty(s.WebId) || !isNullOrEmpty(s.SiteId) || !isNullOrEmpty(s.ServerRelativeWebUrl);
                    
                    if(!isInherited) {
                        return this.getSettingsFromCurrentSite(key, defSettings);
                    }

                    return this.getSettingsFromInhertitedSite(key, s.ServerRelativeWebUrl, defSettings);
                };

                if(isset(this.generalSettings)) {
                    loadSettings<T>(key, defaultSettings).then((settings: T) => {
                        return resolve(settings);
                    });
                }
                else {
                    this.loadGeneralSettings().then(() => {
                        loadSettings<T>(key, defaultSettings).then((settings: T) => {
                            return resolve(settings);
                        });
                    });
                }
            }            
        });
    }

    private getSettingsFromCurrentSite<T = ISettings>(key: string, defaultSettings: T): Promise<T> {
        this.log(`Load Settingskey '${key}' from current site ${this.pageContext.web.serverRelativeUrl}`);
        return this.getSettingsFromLibrary(this.pageContext.web.serverRelativeUrl, key, defaultSettings);
    }

    private getSettingsFromInhertitedSite<T = ISettings>(key: string, siteUrl: string, defaultSettings: T): Promise<T> {
        this.log([`Load Settingskey '${key}' from inherited site ${siteUrl}`, this.generalSettings]);
        return this.getSettingsFromLibrary(siteUrl, key, defaultSettings);
    }

    private getSettingsFromLibrary<T>(serverRelativeWebUrl: string, key: string, defaultSettings: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const spUrlhelper: SPUri = new SPUri(this.pageContext);
            const webAppUrl: string = spUrlhelper.GetWebAppUrl();
            const urlhelper: Uri = new Uri(webAppUrl);
            urlhelper.Combine(serverRelativeWebUrl);
            urlhelper.Combine(`_api/web/GetFileByServerRelativeUrl('${this.getListFileEndpoint(serverRelativeWebUrl, key)}')/$value`);
            let endpoint: string = urlhelper.toString();
            
            this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {

                response.json().then((settings: T) => {
                    return resolve(extend(defaultSettings, settings));
                }).catch((error) => {
                    return resolve(extend(defaultSettings, {}));
                });
            }).catch((error) => {
                return resolve(extend(defaultSettings, {}));
            });
        });
    }

    private getListFileEndpoint(settingsSiteUrl: string, key): string {
        //TODO: EDIT ==> URL Helper
        return settingsSiteUrl + '/' + settingsListUrl + '/' + key + ".json";
    }
}