import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { override } from '@microsoft/decorators';
import { DisplayMode } from '@microsoft/sp-core-library';
import { SPUri } from '../../utility/UrlHelper';
import { GeneralHelper } from '../BaseHelper';
import '@spfxappdev/utility/lib/extensions/StringExtensions';
import { IGeneralSettings } from '../../settings/GeneralSettings.interfaces';
import { GeneralSettings } from '../../settings/GeneralSettings';
import { ISettingsReaderService, SettingsReaderService } from '../../settings/SettingsReaderService';
import { ISettings } from '../../settings/ISettings.interface';
import { BootLoaderService, IBootLoaderService } from '../../boot/BootLoaderService';
import { cssClasses } from '@spfxappdev/utility';
import { BaseComponentContext } from '@microsoft/sp-component-base';
import { Logger } from '@spfxappdev/logger';
import { ISPFxAppDevBaseHelper } from '../BaseHelper';
import { SettingsLoader } from '../SettingsLoader';

export interface ISPFxAppDevClientSideWebPartProps {
    Title?: string;
}


export abstract class SPFxAppDevBaseWebPart<TProperties> extends BaseClientSideWebPart<TProperties> {

    /**
     * Contains multiple helpful Functions.
     */
     public helper: ISPFxAppDevBaseHelper;

    public spfxContext: BaseComponentContext;

    public logger: Logger;
 
    /**
     * Determines wheter the Page is in Edit-Mode.
     */
    public IsPageInEditMode: boolean = false;

    constructor() {
        super();
        this.logger = new Logger(this.getLogCategory());
    }

    public updateWebPartData(data: any): void {
        this.log('SPFxAppDevBaseWebPart updateWebPartData START');
        this.log('SPFxAppDevBaseWebPart updateWebPartData END');
    }

    public getLogCategory(): string {
        return 'SPFxAppDevBaseWebPart';
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
                this.IsPageInEditMode = this.displayMode === DisplayMode.Edit;
                
                this.onDisplayModeChanged = (oldMode: DisplayMode) => {
                    this.IsPageInEditMode = oldMode === DisplayMode.Read;
                    this.render();
                };

                return resolve();
            });
        });
    }

    @override
    protected onDisplayModeChanged(oldDisplayMode: DisplayMode): void {
        this.IsPageInEditMode = oldDisplayMode === DisplayMode.Read;
        this.render();
    }
}

export abstract class SPFxAppDevClientSideWebPart<WPProps = ISPFxAppDevClientSideWebPartProps> extends SPFxAppDevBaseWebPart<WPProps> {
    
    public SettingsReader: ISettingsReaderService;

    public Bootloader: IBootLoaderService;

    public GeneralSettings: IGeneralSettings;

    constructor() {
        super();
    }

    public getLogCategory(): string {
        return 'SPFxAppDevClientSideWebPart';
    }

    protected onInit(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            super.onInit().then(() => {
                this.SettingsReader = this.context.serviceScope.consume(SettingsReaderService.serviceKey);
                this.Bootloader = this.context.serviceScope.consume(BootLoaderService.serviceKey);
                
                this.Bootloader.onLoad(this.getRequiredDataForBoot()).then(() => {
                    if(this.helper.functions.isset(this.GeneralSettings)) {
                        // this.EnableConsoleLogging = this.GeneralSettings.ConsoleLogging;
                        // this.Bootloader.setConsoleProperties(this.EnableConsoleLogging);
                    }

                    return resolve();
                }).catch((error) => {
                    this.logger.error('Error on load Bootloader', error);
                    return resolve();
                });                
            });
        });
    }

    protected getRequiredSettings(): SettingsLoader<ISettings>[] {
        const generalSettings: SettingsLoader<IGeneralSettings> = {
            key: GeneralSettings.key,
            defaultSettings: GeneralSettings.defaultSettings,
            refreshCache: false,
            onLoaded: (settings: IGeneralSettings) => { this.GeneralSettings = settings; }
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