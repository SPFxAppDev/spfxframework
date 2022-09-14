import { getUrlParameter, isNullOrEmpty } from '@spfxappdev/utility';
import '@spfxappdev/utility/lib/extensions/ArrayExtensions';
import { BaseComponentContext } from '@microsoft/sp-component-base';
import { PageContext } from '@microsoft/sp-page-context';

export interface IUrlContext {
    OriginalUrl: string; // 'https://example.com/try?foo=bar&age=20',
    Host: string;
    WebUrl: string; // 'https://example.com/try',
    Path: string; // '/try',
    Query: string;
    Parameters?: UrlParameter; // '?foo=bar&age=20'
    Protocol: string; // https
}

export class UrlHelper {

    public static RemoveAllParametersFromUrl(url: string): string {

        if (typeof url !== 'string') {
            return '';
        }

        return url.split('?')[0].split('&')[0].split('#')[0];
    }

    public static GetUrlParameter(name: string, url?: string): string {
        return getUrlParameter(name, url);
    }
}

export interface IUrlParameter {
    Key: string; // 'foo',
    Value: string; // bar,
}

export class UrlParameter {

    protected Parameters: IUrlParameter[];

    protected Query: string;

    public constructor(query: string) {
        this.Query = query;
        this.Parameters = this.buildParametersArray();
    }

    public onQueryChanged?(): void;

    public add(name: string, value: string, encode: boolean = true): void {
        this.remove(name);

        if (encode) {
            value = encodeURIComponent(value);
        }

        this.Parameters.push({
            Key: name,
            Value: value
        });

        this.buildQuery();
    }

    public get(name: string, decode: boolean = true): string {
        const value: string = UrlHelper.GetUrlParameter(name, this.getQuery());

        if (value && decode) {
            return decodeURIComponent(value);
        }

        return value;
    }

    public getAll(): IUrlParameter[] {
        return this.Parameters;
    }

    public remove(name: string): void {
        const existingParameterIndex: number = this.Parameters.IndexOf(p => p.Key.Equals(name, true));

        if (existingParameterIndex < 0) {
            return;
        }

        this.Parameters.splice(existingParameterIndex, 1);
    }

    public removeAll(): void {
        this.Parameters = [];
        this.buildQuery();
    }

    public getQuery(): string {
        this.buildQuery(false);
        return this.Query;
    }

    public toString(): string {
        return this.getQuery();
    }

    private buildParametersArray(): IUrlParameter[] {
        const parameters: IUrlParameter[] = [];
        this.Query.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        (match, key, value): string => {
            parameters.push({
              Key: key,
              Value: value
          });

          return value;

        });

        return parameters;
    }

    private buildQuery(fireOnChangeEvent: boolean = true): void {
        if (isNullOrEmpty(this.Parameters)) {
            this.Query = '';
            return;
        }

        const queryArray: string[] = [];
        this.Parameters.forEach((param: IUrlParameter) => {
            queryArray.push(`${param.Key}=${param.Value}`);
        });

        const query: string = queryArray.join('&');
        this.Query = '?' + query;

        if (fireOnChangeEvent && typeof this.onQueryChanged === 'function') {
            this.onQueryChanged();
        }
    }
}

export class Uri implements IUrlContext {

    public readonly OriginalUrl: string;
    public Url: string;
    public Host: string;
    public WebUrl: string;
    public Path: string;
    public Query: string;
    public Parameters?: UrlParameter;
    public Protocol: string;
    protected SplittedUrl: string[];

    public constructor(url: string) {
        this.OriginalUrl = url;
        this.createUrlContext(url);
    }

    public toString(): string {
        return this.Url;
    }

    public Combine(urlToCombine: string): void {
        const absoluteUrl: string = this.makeAbsoluteUrl(urlToCombine);
        this.createUrlContext(absoluteUrl);
    }

    protected createUrlContext(url: string): void {
        this.Url = url;
        this.Host = this.getHost(url);
        this.WebUrl = this.getWebUrl(url);
        this.Path = this.getPath(url);
        this.Query = this.getQuery(url);
        this.Protocol = this.getProtocol(url);
        this.Parameters = new UrlParameter(this.Query);
        const self: Uri = this;
        this.Parameters.onQueryChanged = () => {
            self.onParameterQueryChanged();
        };
    }

    protected onParameterQueryChanged(): void {
        // this.Query = this.Parameters.toString();
        const newUrl: string = UrlHelper.RemoveAllParametersFromUrl(this.Url) + this.Parameters.toString();
        this.createUrlContext(newUrl);
    }

    protected makeAbsoluteUrl(urlToCombine: string): string {
        if (urlToCombine.StartsWith('http://') ||
            urlToCombine.StartsWith('https://')) {
            return urlToCombine;
        }

        if (urlToCombine.StartsWith('?') || urlToCombine.StartsWith('&')) {
            const params: UrlParameter = new UrlParameter(urlToCombine);
            params.getAll().forEach((param: IUrlParameter) => {
                this.Parameters.add(param.Key, param.Value);
            });

            return this.toString();
        }

        let absoluteUrl: string = this.WebUrl;
        const relativeUrl: string = this.Path;

        if (absoluteUrl.EndsWith('/')) {
            absoluteUrl = absoluteUrl.substring(0, absoluteUrl.length - 1);
        }

        if (relativeUrl.length > 0 &&
            urlToCombine.StartsWith(relativeUrl)) {
            urlToCombine = urlToCombine.substr(urlToCombine.IndexOf(relativeUrl) + urlToCombine.length);
        }

        if (urlToCombine.StartsWith('/')) {
            urlToCombine = urlToCombine.substr(1);
        }

        const url: string = absoluteUrl + '/' + urlToCombine + this.Parameters.toString();
        return url;
    }

    protected getSplittedUrl(url: string): string[] {
        if (this.SplittedUrl) {
            return this.SplittedUrl;
        }

        this.SplittedUrl = url.split('/');
        return this.SplittedUrl;
    }

    protected getWebUrl(url: string): string {
        url = UrlHelper.RemoveAllParametersFromUrl(url);
        return url;
    }

    protected getProtocol(url: string): string {
        const pathArray: string[] = this.getSplittedUrl(url);
        return pathArray[0];
    }

    protected getHost(url: string): string {
        const pathArray: string[] = this.getSplittedUrl(url);
        return pathArray[2];
    }

    protected getHostWithProtocol(url: string): string {
        const protocol: string = this.getProtocol(url);
        const host: string = this.getHost(url);
        return `${protocol}//${host}`;
    }

    protected getPath(url: string): string {
        const webUrl: string = this.getWebUrl(url);
        const hostWithProtocol: string = this.getHostWithProtocol(url);
        return webUrl.replace(hostWithProtocol, '');
    }

    protected getQuery(url: string): string {
        const webUrl: string = this.getWebUrl(url);
        return url.replace(webUrl, '');
    }

}

export interface ISPUrlContext extends IUrlContext {
    AbsoluteWebUrl: string;
    ServerRelativeWebUrl: string;
    AbsoluteSiteUrl: string;
    ServerRelativeSiteUrl: string;
}

export class SPUri extends Uri implements ISPUrlContext {

    public AbsoluteWebUrl: string;
    public ServerRelativeWebUrl: string;
    public AbsoluteSiteUrl: string;
    public ServerRelativeSiteUrl: string;
    public ListUrl: string;

    public constructor(ctx: BaseComponentContext|PageContext) {
        const pageContext = ctx instanceof BaseComponentContext ? ctx.pageContext : ctx;
        super(pageContext.web.absoluteUrl);
        this.AbsoluteWebUrl = pageContext.web.absoluteUrl;
        this.ServerRelativeWebUrl = pageContext.web.serverRelativeUrl;
        this.AbsoluteSiteUrl = pageContext.site.absoluteUrl;
        this.ServerRelativeSiteUrl = pageContext.web.serverRelativeUrl;
        this.ListUrl = pageContext.list.serverRelativeUrl;
    }

    public GetWebAppUrl(): string {
        const siteUrl: string = this.AbsoluteSiteUrl;
        const webAppUrl: string = siteUrl.split('/').slice(0, 3).join('/');
        return webAppUrl;
    }

    public MakeAbsoluteSiteUrl(urlToCombine: string): string {
        let absoluteSiteUrl: string = '';
        let relativeSiteUrl: string = '';

        absoluteSiteUrl = this.AbsoluteSiteUrl;
        relativeSiteUrl = this.ServerRelativeSiteUrl;

        return this.MakeAbsoluteUrl(absoluteSiteUrl, relativeSiteUrl, urlToCombine);
    }

    public MakeAbsoluteWebUrl(urlToCombine: string): string {
        let absoluteWebUrl: string = '';
        let relativeWebUrl: string = '';

        absoluteWebUrl = this.AbsoluteWebUrl;
        relativeWebUrl = this.ServerRelativeWebUrl;

        return this.MakeAbsoluteUrl(absoluteWebUrl, relativeWebUrl, urlToCombine);
    }

    public MakeRelativeSiteUrl(urlToCombine: string): string {
        const relativeSiteUrl: string = this.ServerRelativeSiteUrl;
        return this.MakeRelativeUrl(relativeSiteUrl, urlToCombine);
    }

    public MakeRelativeWebUrl(urlToCombine: string): string {
        const relativeWebUrl: string = this.ServerRelativeWebUrl;
        return this.MakeRelativeUrl(relativeWebUrl, urlToCombine);
    }

    public GetCurrentFolderURL() {
        const uri: Uri = new Uri(window.location.href);    
        const idParam: string = uri.Parameters.get("id", true);
        const rootParam: string = uri.Parameters.get("RootFolder", true);
        let url = idParam != null ? idParam : rootParam;
        let re = new RegExp(`${this.ListUrl}/`, "gi");
        url = url ? url.replace(re, "") : "";    
        return url;    
    }

    private MakeAbsoluteUrl(absoluteUrl: string, relativeUrl: string, urlToCombine: string): string {
        if (urlToCombine.StartsWith('http://') ||
            urlToCombine.StartsWith('https://')) {
            return urlToCombine;
        }

        if (absoluteUrl.EndsWith('/')) {
            absoluteUrl = absoluteUrl.substring(0, absoluteUrl.length - 1);
        }

        const relativeUrlWithOutLeadingSlash: string = relativeUrl.StartsWith("/") ? relativeUrl.substr(1) : relativeUrl;
        const urlToCombineWithOutLeadingSlash: string = urlToCombine.StartsWith("/") ? urlToCombine.substr(1) : urlToCombine;

        if (relativeUrl.length > 0 &&
        relativeUrl !== '/' && urlToCombineWithOutLeadingSlash.StartsWith(relativeUrlWithOutLeadingSlash)) {
            urlToCombine = urlToCombineWithOutLeadingSlash.substr(urlToCombineWithOutLeadingSlash.IndexOf(relativeUrlWithOutLeadingSlash) + relativeUrlWithOutLeadingSlash.length);            
        }

        if (urlToCombine.StartsWith('/')) {
            urlToCombine = urlToCombine.substr(1);
        }

        return absoluteUrl + '/' + urlToCombine;
    }

    private MakeRelativeUrl(relativeUrl: string, urlToCombine: string): string {
        if (relativeUrl.EndsWith('/')) {
            relativeUrl = relativeUrl.substring(0, relativeUrl.length - 1);
        }

        const relativeUrlWithOutLeadingSlash: string = relativeUrl.StartsWith("/") ? relativeUrl.substr(1) : relativeUrl;
        const urlToCombineWithOutLeadingSlash: string = urlToCombine.StartsWith("/") ? urlToCombine.substr(1) : urlToCombine;

        if (relativeUrl.length > 0 &&
        relativeUrl !== '/' && urlToCombineWithOutLeadingSlash.StartsWith(relativeUrlWithOutLeadingSlash)) {
            urlToCombine = urlToCombineWithOutLeadingSlash.substr(urlToCombineWithOutLeadingSlash.IndexOf(relativeUrlWithOutLeadingSlash) + relativeUrlWithOutLeadingSlash.length);            
        }

        if (relativeUrl.length > 0 &&
        urlToCombine.StartsWith(relativeUrl)) {
            urlToCombine = urlToCombine.substr(urlToCombine.IndexOf(relativeUrl) + urlToCombine.length);
        }

        if (urlToCombine.StartsWith('/')) {
            urlToCombine = urlToCombine.substr(1);
        }

        return relativeUrl + '/' + urlToCombine;
    }
}