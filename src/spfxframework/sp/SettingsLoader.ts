import { ISettings } from '../settings/SettingsReaderService';
export type SettingsLoader<T = ISettings> = { key: string, defaultSettings: T, refreshCache: boolean, onLoaded(settings: T): void };