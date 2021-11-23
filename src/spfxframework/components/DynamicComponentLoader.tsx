// import * as React from 'react';
// import { isset } from '@spfxappdev/utility';
// import { LogType, log, ClassLoggerBase } from '@spfxappdev/logger';
// import { Spinner } from 'office-ui-fabric-react/lib/Spinner';

// export enum ComponentType {
//     Custom
// }

// export enum ComponentPageType {
//     Custom
// }

// export interface IDynamicComponentLoaderProps {
//     componentType: ComponentType|ComponentPageType;
//     componentData: any;
//     onComponentLoaded?(component: any): void;
//     onCustomComponentLoad?(): void;
//     showSpinner?: boolean;
//     spinnerLabel?: string;
//     componentName?: string;
// }

// export interface IDynamicComponentLoaderState {
//     component: any;
// }

// export interface DynamicComponentLoaderBase extends ClassLoggerBase {}

// export abstract class DynamicComponentLoaderBase extends React.Component<IDynamicComponentLoaderProps, IDynamicComponentLoaderState> {

//     protected loggingCategory: string = "DynamicComponentLoaderBase";

//     private showSpinner: boolean = true;
    
//     private spinnerLabel: string = null;

//     private componentName: string = null;

//     constructor(props: IDynamicComponentLoaderProps, state: IDynamicComponentLoaderState) {
//         super(props);

//         this.showSpinner = !isset(props.showSpinner) ? true : props.showSpinner;
//         this.componentName = !isset(props.componentName) ? '' : props.componentName;
//         this.spinnerLabel = !isset(props.spinnerLabel) ? `Loading ${this.componentName}...` : props.spinnerLabel;

//         this.state = {
//             component: null
//         };
//     }

//     public async componentDidMount(): Promise<void> {
//         return this.onImport();
//     }

//     public async componentDidUpdate(previousProps: IDynamicComponentLoaderProps, previousState: IDynamicComponentLoaderState): Promise<void> {
//         const reloadComponent: boolean = previousProps.componentType !== this.props.componentType;
        
//         if (reloadComponent) {
//             return this.onImport();
//         }

//         return Promise.resolve();
//     }

//     public render(): React.ReactElement<IDynamicComponentLoaderProps> {
//         const { component } = this.state;
        
//         if (!isset(component)) {
//             if(this.showSpinner) {
//                 return (<div>
//                     <Spinner label={this.spinnerLabel} />
//                     {isset(this.props.children) && this.props.children}
//                 </div>);
//             }

//             return (<div>{isset(this.props.children) && this.props.children}</div>);
//         }
        
//         const Component: any = component;
//         return <Component {...this.props.componentData} />;
//     }

//     public getComponent(): any {
//         return this.state.component;
//     }

//     protected async onImport(): Promise<void> {
//         throw "onImport is not implemented";
//     }

//     protected onComponentLoadedSuccess(component: any): void {

//         this.setState({
//             component: component.default
//         });

//         if(isset(this.props.onComponentLoaded)) {
//             this.props.onComponentLoaded(component);
//             return;
//         }
//     }

//     protected onComponentLoadedError(error: any): void {
//         this.log(LogType.Error, error);
//         this.log(LogType.Error, `"${this.props.componentType.toString()}" not yet supported`);
//     }
// }

// @log({ customLogCategory: "DynamicComponentLoader" })
// export class DynamicComponentLoader extends DynamicComponentLoaderBase {

//     constructor(props: IDynamicComponentLoaderProps, state: IDynamicComponentLoaderState) {
//         super(props, state);
//         this.loggingCategory = "DynamicComponentLoader";
//     }

//     protected async onImport(): Promise<void> {
        
//         const componentType: ComponentType = this.props.componentType as ComponentType;

//         if(componentType == ComponentType.Custom) {

//             if(!isset(this.props.onCustomComponentLoad)) {
//                 this.logger.log("Component Type is Custom, but Property onCustomComponentLoad is not set");
//                 return Promise.resolve();
//             }

//             this.props.onCustomComponentLoad.apply(this);
//             return Promise.resolve();
//         }

//         switch (componentType) {
//             // case ComponentType.YourComponentType:
//             //     import(
//             //         /* webpackChunkName: 'yourcomponenttype' */
//             //         "path/to/component"
//             //         )
//             //       .then((component: any) => this.onComponentLoadedSuccess(component))
//             //       .catch((error: any) => this.onComponentLoadedError(error));
//             //     break;
//             default:
//                 break;
//         }
        
//         return Promise.resolve();
//     }
// }

// @log({ customLogCategory: "DynamicPageLoader" })
// export class DynamicPageLoader extends DynamicComponentLoaderBase {

//     constructor(props: IDynamicComponentLoaderProps, state: IDynamicComponentLoaderState) {
//         super(props, state);
//         this.loggingCategory = "DynamicPageLoader";
//     }

//     protected async onImport(): Promise<void> {
        
//         const componentType: ComponentPageType = this.props.componentType as ComponentPageType;

//         if(componentType == ComponentPageType.Custom) {

//             if(!isset(this.props.onCustomComponentLoad)) {
//                 this.logger.log("Component Type is Custom, but Property onCustomComponentLoad is not set");
//                 return Promise.resolve();
//             }

//             this.props.onCustomComponentLoad.apply(this);
//             return Promise.resolve();
//         }

//         // switch (componentType) {
//         //     case ComponentPageType.AdministrationOverview:
//         //         import(
//         //             /* webpackChunkName: 'administrationoverview' */
//         //             "../webparts/administration/pages/Overview/Overview"
//         //             )
//         //           .then((component: any) => this.onComponentLoadedSuccess(component))
//         //           .catch((error: any) => this.onComponentLoadedError(error));
//         //         break;
//         //     case ComponentPageType.AdministrationGeneralSettings:
//         //         import(
//         //             /* webpackChunkName: 'generalsettings' */
//         //             "../webparts/administration/pages/General/GeneralSettings"
//         //             )
//         //           .then((component: any) => this.onComponentLoadedSuccess(component))
//         //           .catch((error: any) => this.onComponentLoadedError(error));
//         //         break;
//         //     case ComponentPageType.AdministrationLanguageSettings:
//         //             import(
//         //                 /* webpackChunkName: 'languagesettings' */
//         //                 "../webparts/administration/pages/Language/LanguageSettings"
//         //                 )
//         //               .then((component: any) => this.onComponentLoadedSuccess(component))
//         //               .catch((error: any) => this.onComponentLoadedError(error));
//         //             break;
//         //     case ComponentPageType.AdministrationMiscSettings:
//         //         import(
//         //             /* webpackChunkName: 'miscsettings' */
//         //             "../webparts/administration/pages/Misc/MiscSettings"
//         //             )
//         //             .then((component: any) => this.onComponentLoadedSuccess(component))
//         //             .catch((error: any) => this.onComponentLoadedError(error));
//         //         break;
//         //     case ComponentPageType.AdministrationGuidedTourSettings:
//         //         import(
//         //             /* webpackChunkName: 'guidedtoursettings' */
//         //             "../webparts/administration/pages/GuidedTour/GuidedTourSettings"
//         //             )
//         //             .then((component: any) => this.onComponentLoadedSuccess(component))
//         //             .catch((error: any) => this.onComponentLoadedError(error));
//         //         break;
//         //     default:
//         //         break;
//         // }
        
//         return Promise.resolve();
//     }
// }