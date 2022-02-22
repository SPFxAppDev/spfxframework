
import { Logger } from '@spfxappdev/logger';
import { ISPFxAppDevBaseHelper } from '../BaseHelper';
import '@spfxappdev/utility/lib/extensions/StringExtensions';
import { cssClasses } from '@spfxappdev/utility';
import { SPFxAppDevBaseApplicationCustomizer, IApplicationCustomizerProps } from './SPFxAppDevBaseApplicationCustomizer';
import * as React from 'react';

export interface ISPFxAppDevApplicationCustomizerComponentProps<T> {
    ApplicationCustomizer: T;
}

export abstract class SPFxAppDevApplicationCustomizerComponent<APP extends SPFxAppDevBaseApplicationCustomizer<IApplicationCustomizerProps>, P = ISPFxAppDevApplicationCustomizerComponentProps<APP>, S = {}> extends React.Component<P, S>   {

    protected App: APP;

    public logger: Logger;

    /**
     * Contains multiple helpful Functions.
     */
    protected helper: ISPFxAppDevBaseHelper;

    protected cssClasses: (...args: any[]) => string = cssClasses;

    constructor(props: P, state?: S) {
        super(props, state);
        const properties: any = props as any as ISPFxAppDevApplicationCustomizerComponentProps<APP>;
        this.App = properties.ApplicationCustomizer;
        this.logger = this.App.logger;
        this.helper = this.App.helper;
    }

    /**
     * Log's the provided Value in the Console under the loggingCategory of the ApplicationCustomizer.
     * @param logValue The Value to Log in the Console.
     */
    protected log(logValue: any): void {
        this.App.log(logValue);
    }
}