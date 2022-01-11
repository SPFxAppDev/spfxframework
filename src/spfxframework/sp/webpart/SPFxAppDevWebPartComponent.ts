import '@spfxappdev/utility/lib/extensions/StringExtensions';
import { cssClasses } from '@spfxappdev/utility';
import { SPFxAppDevBaseWebPart, ISPFxAppDevClientSideWebPartProps } from './SPFxAppDevBaseWebPart';
import { ISPFxAppDevBaseHelper } from '../BaseHelper';
import { Logger } from '@spfxappdev/logger';
import * as React from 'react';

export interface ISPFxAppDevWebPartComponentProps<T> {
    Title?: string;
    WebPart: T;
}

export abstract class SPFxAppDevWebPartComponent<WP extends SPFxAppDevBaseWebPart<ISPFxAppDevClientSideWebPartProps>, P = ISPFxAppDevWebPartComponentProps<WP>, S = {}> extends React.Component<P, S> {

    protected cssClasses: (...args: any[]) => string = cssClasses;

    protected WebPart: WP;

    public logger: Logger;

    /**
     * Contains multiple helpful Functions.
     */
    protected helper: ISPFxAppDevBaseHelper;

    constructor(props: P) {
        super(props);
        const properties: any = props as any as ISPFxAppDevWebPartComponentProps<WP>;
        this.WebPart = properties.WebPart;
        this.logger = this.WebPart.logger;
        this.helper = this.WebPart.helper;
    }

    /**
     * Log's the provided Value in the Console under the loggingCategory of the Webpart.
     * @param logValue The Value to Log in the Console.
     */
    protected log(logValue: any): void {
        this.WebPart.log(logValue);
    }
}