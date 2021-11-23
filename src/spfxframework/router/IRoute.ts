// import { ComponentPageType } from '../../components/DynamicComponentLoader';

export interface IRoute {
    path: string;
    //TODO: ComponentPageType einbauen
    page: any;
    matchedPath?: any;
}