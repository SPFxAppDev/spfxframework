// import { Logger, LogType } from '@spfxappdev/logger';

export class DomHelper {
    public static readonly LoggingKey: string = 'DomHelper';

    public static WaitUntilElementExistsOrCancel(selector: string, maxIntervals: number = 100, intervallTimeoutInMs: number = 100): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let elementExists: boolean = false;
            const checkExist: number = window.setInterval(() => {
                maxIntervals--;
                const element: NodeListOf<Element> = document.body.querySelectorAll(selector);

                elementExists = element != null &&
                typeof element !== 'undefined' &&
                element.length > 0;

                if (maxIntervals <= 0) {
                    clearInterval(checkExist);
                    return resolve(elementExists);
                }

                if (!elementExists) {
                //TODO: Add Logging    Logger.Log(('Element does not exists! ' + selector), DomHelper.LoggingKey, LogType.Log, enableConsoleLogging);
                   return;
                }

                clearInterval(checkExist);
                elementExists = true;
                return resolve(elementExists);

             }, intervallTimeoutInMs);
        });
    }

    public static GetSPContentContainer(): Promise<Element>  {
        const isPageContent: boolean = document.getElementById('spoAppComponent') == null;
        const selector: string = isPageContent ? '.mainContent div[data-is-scrollable="true"] > div[class^="st_"]' : 'div[class$="-content"] div[class$="-innerContent"]';
        const mobileselector: string = '.mainContent > [class^="pageLayout"]';

        return new Promise<Element>((resolve, reject) => {
            DomHelper.WaitUntilElementExistsOrCancel(selector).then((exists: boolean) => {
                if (!exists) {
                    const mobilecontainer: Element = document.body.querySelectorAll(mobileselector)[0];

                    if (isPageContent && mobilecontainer !== undefined && mobilecontainer !== null) {
                        return resolve(mobilecontainer.children[0]);
                    }
                    return resolve(null);
                }

                const container: Element = document.body.querySelectorAll(selector)[0];

                if (isPageContent) {
                    return resolve(container);
                }

                return resolve(container.parentElement);
            });
        });
    }
}