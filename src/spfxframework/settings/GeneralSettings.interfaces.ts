import { LogLevel } from "@spfxappdev/logger";

export interface IGeneralSettings {
    SettingsSourceSite: ISettingsSourceSite;
    Localizations: ILocalizations;
    ConsoleLoggingLevel: LogLevel;
}

export interface ISettingsSourceSite {
    SiteId: string;
    WebId: string;
    ServerRelativeWebUrl: string;
}

export type LanguageKeyValue = { [key: string]: string; };

export type Localization = { [lang: string]: LanguageKeyValue; };

export interface ILocalizations {
    FallbackLocalization: string;
    AvailableLanguages: string[];
    CustomLanguageLocalizations: Localization;
    SystemLanguageLocalizations: Localization;
}