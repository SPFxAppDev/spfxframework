import '@spfxappdev/utility/lib/extensions/StringExtensions';
import { cssClasses } from '@spfxappdev/utility';
import { SPFxAppDevBaseWebPart, ISPFxAppDevClientSideWebPartProps } from './SPFxAppDevBaseWebPart';
import { ISPFxAppDevBaseHelper } from '../BaseHelper';
import { LogType } from '@spfxappdev/logger';
import * as React from 'react';

export interface ISPFxAppDevWebPartComponentProps<T> {
    Title?: string;
    WebPart: T;
}

export abstract class SPFxAppDevWebPartComponent<WP extends SPFxAppDevBaseWebPart<ISPFxAppDevClientSideWebPartProps>, P = ISPFxAppDevWebPartComponentProps<WP>, S = {}> extends React.Component<P, S> {

    protected cssClasses: (...args: any[]) => string = cssClasses;

    protected WebPart: WP;

    /**
     * Contains multiple helpful Functions.
     */
    protected helper: ISPFxAppDevBaseHelper;

    constructor(props: P) {
        super(props);
        const properties: any = props as any as ISPFxAppDevWebPartComponentProps<WP>;
        this.WebPart = properties.WebPart;
        this.helper = this.WebPart.helper;
    }

    /**
     * Log's the provided Value in the Console under the loggingCategory of the Webpart.
     * @param logValue The Value to Log in the Console.
     * @param logType The Type of Logging (Warning, Info, Error, Table or Log).
     */
    protected log(logValue: any, logType: LogType = LogType.Log): void {
        this.WebPart.log(logValue, logType);
    }
}