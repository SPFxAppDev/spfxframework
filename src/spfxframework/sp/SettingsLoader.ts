import { ISettings } from '../settings/ISettings.interface';
export type SettingsLoader<T = ISettings> = { key: string, defaultSettings: T, refreshCache: boolean, onLoaded(settings: T): void };