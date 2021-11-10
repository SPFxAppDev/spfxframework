
import { isNullOrEmpty } from '@spfxappdev/utility';
import '@spfxappdev/utility/lib/extensions/ArrayExtensions';

export interface IEventListener {
    Sequence: number;
    Execute?(name: string, lastEventResult: IEventListenerResult|null, ...args: any[]): IEventListenerResult;
}

export interface IEventListenerResult {
    ErrorOccurred: boolean;
    Error: string|Error;
    Result: any;
    DisableEventListening: boolean;
}

export class EventHandler {

    public static Listen(name: string, listener: IEventListener): void  {
        EventHandler.register(name, listener);
    }

    public static Fire(name: string, ...args: any[]): any  {
        const allListener: IEventListener[]|null = EventHandler.getListener(name);

        if (isNullOrEmpty(allListener)) {
            return '';
        }

        const result: IEventListenerResult[] = [];
        let lastEventResult: IEventListenerResult = null;
        const sortedListener: IEventListener[] = allListener.OrderBy(listener => listener.Sequence);

        for (let i: number = 0; i < sortedListener.length; i++) {
            const listener: IEventListener = sortedListener[i];
            lastEventResult = listener.Execute(name, lastEventResult, args);

            if (isNullOrEmpty(lastEventResult) ||
            lastEventResult.ErrorOccurred) {
                continue;
            }

            if (!isNullOrEmpty(lastEventResult.Result)) {
                result.push(lastEventResult.Result);
            }

            if (lastEventResult.DisableEventListening) {
                break;
            }
        }

        return result;
    }

    private static generateWindowListenerObject(name: string): void {
        window['SPFxAppDevEventListener'] = window['SPFxAppDevEventListener'] || {};
        window['SPFxAppDevEventListener'][name] = window['SPFxAppDevEventListener'][name] || [];
    }

    private static register(name: string, listener: IEventListener): void {
        EventHandler.generateWindowListenerObject(name);
        window['SPFxAppDevEventListener'][name].push(listener);
    }

    private static getListener(name: string): IEventListener[]|null {
        EventHandler.generateWindowListenerObject(name);
        const allListener: IEventListener[] = window['SPFxAppDevEventListener'][name] as IEventListener[];

        if (isNullOrEmpty(allListener)) {
            return null;
        }

        return allListener;
    }
}