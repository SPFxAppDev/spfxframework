import { Logger } from "@spfxappdev/logger";
import { IGeneralSettings } from "./GeneralSettings.interfaces";

export class GeneralSettings {
    public static key: string = "SPFxAppDevGeneralSettings";

    public static defaultSettings: IGeneralSettings = {
        SettingsSourceSite: {
            SiteId: '',
            WebId: '',
            ServerRelativeWebUrl: ''
        },
        Localizations: {
            FallbackLocalization: 'en-US',
            AvailableLanguages: ['en-US', 'de-DE'],
            CustomLanguageLocalizations: {
                'en-US': {},
                'de-DE': {},
            },
            SystemLanguageLocalizations: {
                'en-US': {},
                'de-DE': {}
            }
        },
        ConsoleLoggingLevel: Logger.DefaultSettings.LogLevel
    };
}