import { IRoute } from './IRoute';
import '@spfxappdev/utility/lib/extensions/ArrayExtensions';
// import { ComponentPageType } from '../components/DynamicComponentLoader';
import { isNullOrEmpty } from '@spfxappdev/utility';
import { log, ClassLoggerBase } from '@spfxappdev/logger';

export interface IRouterOptions {
    routes: IRoute[];
    onRouteChanged(route: IRoute): void;
    onLoad?(route: IRoute): void;
    // errorPage?: ComponentPageType;

}

export interface Router extends ClassLoggerBase {}

@log({ customLogCategory: "Router" })
export class Router
{
    private currentRoutePath: string = "/";

    private currentMatchedPath: string = "/";

    private options: IRouterOptions;

    private routes: IRoute[];

    constructor(options: IRouterOptions) {
        window.addEventListener('hashchange', () => this.onLocationHashChanged());
        this.options = options;
        this.routes = options.routes;
        this.onLoad();
    }

    private onLoad(): void {
        const route: IRoute = this.match();

        if(!isNullOrEmpty(route)) {
            this.currentRoutePath = route.path;
            this.currentMatchedPath = !isNullOrEmpty(route.matchedPath) ? route.matchedPath.input : route.path;
        }

        if(this.options.onLoad) {
            this.options.onLoad(route);
        }
    }

    private onLocationHashChanged(): void {
        const route: IRoute = this.match();

        if(isNullOrEmpty(route)) {
            return;
        }

        if(!isNullOrEmpty(route.matchedPath) && route.matchedPath.input == this.currentMatchedPath) {
            this.logger.log("matchedPath is same");
            return;
        }
        else if(isNullOrEmpty(route.matchedPath) && route.path == this.currentRoutePath) {
            this.logger.log("path is same");
            return;
        }

        this.currentRoutePath = route.path;
        this.currentMatchedPath = !isNullOrEmpty(route.matchedPath) ? route.matchedPath.input : route.path;
        this.options.onRouteChanged(route);
    }

    private match(): IRoute {
        const hash: string = window.location.hash;
        const url: string = !hash.IsEmpty() ? hash.slice(1) : '/';
        //var routeMatcher = new RegExp(route.replace(/:[^\s/]+/g, '([\\w-]+)'));
        //const route: IRoute = routes.FirstOrDefault(r => r.path.Equals(url, true));
        let matchedPath: RegExpMatchArray;
        const route: IRoute = this.routes.FirstOrDefault(r => {
            const matcher: RegExp = new RegExp("^" + r.path.replace(/:[^\s/]+/g, '([\\w-]+)') + "$");
            if(!isNullOrEmpty(url.match(matcher))) {
                matchedPath = url.match(matcher);
                return true;
            }

            return false;
        });

        if(!isNullOrEmpty(route)) {
            route.matchedPath = matchedPath;
        }

        return route;
    }
}