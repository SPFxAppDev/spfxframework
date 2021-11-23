import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import { Logger } from '@spfxappdev/logger';
import { SPUri } from '../../utility/UrlHelper';
import { GeneralHelper, ISPFxAppDevBaseHelper } from '../BaseHelper';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { override } from '@microsoft/decorators';
import '@spfxappdev/utility/lib/extensions/StringExtensions';
import { SPfxAppDevConfiguration } from '../../config/Configuration';
import { BaseComponentContext } from '@microsoft/sp-component-base';
import { cssClasses } from '@spfxappdev/utility';
import { ISettingsReaderService, SettingsReaderService } from '../../settings/SettingsReaderService';
import { BootLoaderService, IBootLoaderService } from '../../boot/BootLoaderService';
import { IGeneralSettings } from '../../settings/GeneralSettings.interfaces';
import { GeneralSettings } from '../../settings/GeneralSettings';
import { SettingsLoader } from '../SettingsLoader';
import { ISettings } from '../../settings/ISettings.interface';

export interface IApplicationCustomizerProps {}

export abstract class SPFxAppDevBaseApplicationCustomizer<TProperties> extends BaseApplicationCustomizer<TProperties> {

    /**
     * Contains multiple helpful Functions.
     */
    public helper: ISPFxAppDevBaseHelper;

    public spfxContext: BaseComponentContext;

    public logger: Logger;
    
    constructor() {
        super();
        this.logger = new Logger(this.getLogCategory());
    }

    public showExtension(): Promise<boolean> {

        if(this.helper.functions.isNullOrEmpty(SPfxAppDevConfiguration.solutionId)) {
            return Promise.resolve(true);
        }

        const endpoint: string = this.helper.url.MakeAbsoluteSiteUrl(`/_api/web/AppTiles?$filter=(AppPrincipalId ne '') and (ProductId eq guid'${SPfxAppDevConfiguration.solutionId}')&$select=AppStatus`);

        return new Promise<boolean>((resolve, reject) => {
            this.context.spHttpClient.get(endpoint, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {
                response.json().then((responsejson) => {
                    this.log(responsejson);
                    if (responsejson.value.length === 0) {
                        return resolve(false);
                    }

                    return resolve(responsejson.value[0]['AppStatus'] === 4);
                }, (error: any) => {
                    this.logger.error(error);
                    return resolve(false);
                });
            });
        });
    }

    public getLogCategory(): string {
        return 'SPFxAppDevBaseApplicationCustomizer';
    }

    /**
     * Log's the provided Value in the Console under the loggingCategory of the ApplicationCustomizer.
     * @param logValue The Value to Log in the Console.
     */
     public log(...logValue: any[]): void {
        this.logger.log(...logValue);
    }

    protected cssClasses: (...args: any[]) => string = cssClasses;

    @override
    protected onInit(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.onInit().then(() => {
                this.helper = {
                    url: new SPUri(this.context),
                    functions: new GeneralHelper()
                };

                this.spfxContext = this.context;
                return resolve();                
            });
        });
    }
}

export abstract class SPFxAppDevApplicationCustomizer<AppProps = IApplicationCustomizerProps> extends SPFxAppDevBaseApplicationCustomizer<AppProps> {
    
    // protected bootloader: Bootloader = null;

    // public Settings: GlobalSettings;

    public SettingsReader: ISettingsReaderService;

    public Bootloader: IBootLoaderService;

    public GeneralSettings: IGeneralSettings;
    
    constructor() {
        super();
    }

    public getLogCategory(): string {
        return 'SPFxAppDevApplicationCustomizer';
    }

    protected onInit(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.onInit().then(() => {
                this.SettingsReader = this.context.serviceScope.consume(SettingsReaderService.serviceKey);
                this.Bootloader = this.context.serviceScope.consume(BootLoaderService.serviceKey);
                
                this.Bootloader.onLoad(this.getRequiredDataForBoot()).then(() => {
                    // if(this.helper.functions.isset(this.GeneralSettings)) {
                    //     // this.EnableConsoleLogging = this.GeneralSettings.ConsoleLogging;
                    //     // this.Bootloader.setConsoleProperties(this.EnableConsoleLogging);
                    // }

                    return resolve();
                }).catch((error) => {
                    this.logger.error('Error on load Bootloader', error);
                    return resolve();
                })
            });
        });
    }

    protected getRequiredSettings(): SettingsLoader<ISettings>[] {
        const generalSettings: SettingsLoader<IGeneralSettings> = {
            key: GeneralSettings.key,
            defaultSettings: GeneralSettings.defaultSettings,
            refreshCache: false,
            onLoaded: (settings: IGeneralSettings) => { 
                this.GeneralSettings = settings; 
                Logger.DefaultSettings.LogLevel = this.GeneralSettings.ConsoleLoggingLevel;
            }
        };
        
        return [generalSettings];
    }

    protected getRequiredDataForBoot(): Array<Promise<void>> {
        const promises: Array<Promise<void>> = [];

        promises.push(this.loadRequiredSettings());

        return promises;
    }

    private loadRequiredSettings(): Promise<void> {
        const allPromises = [];

        const allSettings = this.getRequiredSettings();

        if(this.helper.functions.isNullOrEmpty(allSettings)) {
            return Promise.resolve();
        }

        allSettings.forEach((settings: SettingsLoader<ISettings>) => {
            allPromises.push(this.SettingsReader.getSettings(settings.key, settings.defaultSettings, settings.refreshCache));
        });

        return new Promise<void>((resolve, reject) => {
            Promise.all(allPromises).then((allSettingsFromReader: ISettings[]) => {
                allSettings.forEach((settings: SettingsLoader<ISettings>, index: number) => {
                    const settingsFromReader = allSettingsFromReader[index];
                    settings.onLoaded.call(this, settingsFromReader);
                });

                return resolve();
            });
        });
    }
}