import { BaseComponentContext } from '@microsoft/sp-component-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { SPUri } from '../../utility/UrlHelper';
import { SessionStorage } from '@spfxappdev/storage';
// import { Logger, LogType } from '@spfxappdev/logger';
// import { GlobalSettings } from '../../settings/GlobalSettings';
//TODO: Optimize this code...
//TODO: Add Logging again, check if decorator @log is possible to use
export class PortalUser {

    public AccountName: string;

    public FirstName: string;

    public LastName: string;

    public DisplayName: string;

    public Email: string;

    public UserProfileProperties: Array<UserProfilePropertyObject>;

    public AboutMe: string;

    public Interests: string;

    public PastProjects: string;

    public Schools: string;

    public Skills: string;

    public AskMeAbout: string;

    public UserPhotoAspxUrl: string;

    public PercentCompleted: number;

    public Id: number;

    private readonly loggingKey: string = 'CurrentUserProfile';

    private propertyNames: any[] = [
        { PortalUserUserProperty: 'AboutMe', SPProfileFieldName: 'AboutMe' },
        { PortalUserUserProperty: 'AccountName', SPProfileFieldName: 'AccountName' },
        { PortalUserUserProperty: 'AskMeAbout', SPProfileFieldName: 'SPS-Responsibility' },
        { PortalUserUserProperty: 'Skills', SPProfileFieldName: 'SPS-Skills' },
        { PortalUserUserProperty: 'PastProjects', SPProfileFieldName: 'SPS-PastProjects' },
        { PortalUserUserProperty: 'Schools', SPProfileFieldName: 'SPS-School' },
        { PortalUserUserProperty: 'Interests', SPProfileFieldName: 'SPS-Interests' },
        { PortalUserUserProperty: 'FirstName', SPProfileFieldName: 'FirstName' },
        { PortalUserUserProperty: 'LastName', SPProfileFieldName: 'LastName' },
        { PortalUserUserProperty: 'Id', SPProfileFieldName: 'AuhtorId' }
    ];

    public AssignPropertiesFromSPRequest(ctx: BaseComponentContext, userProperties: CurrentUserProfileRequestResult): void {
        this.DisplayName = userProperties.DisplayName;
        this.Email = userProperties.Email;
        this.UserProfileProperties = userProperties.UserProfileProperties;
        // Logger.Log(this.UserProfileProperties, this.loggingKey, LogType.Log, enableConsoleLogging);

        this.PercentCompleted = 0;

        for (let index: number = 0; index < this.propertyNames.length; index++) {
            const element: { PortalUserUserProperty: string; SPProfileFieldName: string; } = this.propertyNames[index];
            this[element.PortalUserUserProperty] = this.TryGetPropertyByName(element.SPProfileFieldName, null);

            if (typeof this[element.PortalUserUserProperty] === 'undefined' ||
                this[element.PortalUserUserProperty] === null ||
                (typeof this[element.PortalUserUserProperty] === 'string' && this[element.PortalUserUserProperty].length < 1)) {
                continue;
            }

            this.PercentCompleted += 1;
        }

        if (this.FirstName.length > 0 && this.LastName.length > 0) {
            this.DisplayName = this.FirstName + ' ' + this.LastName;
        }

        this.PercentCompleted = this.PercentCompleted === 0 ? 0 : Math.round((this.PercentCompleted / this.propertyNames.length) * 100);

        const urlHelper: SPUri = new SPUri(ctx);
        this.UserPhotoAspxUrl = urlHelper.MakeAbsoluteSiteUrl(`/_layouts/15/userphoto.aspx?size=M&accountname=${this.Email}`);
    }

    public TryGetPropertyByName(propertyName: string, defaultValueIfNotExists?: any): any {

        if (!this.UserProfileProperties) {
            return defaultValueIfNotExists;
        }

        propertyName = propertyName.toLowerCase();

        for (let index: number = 0; index < this.UserProfileProperties.length; index++) {
            const element: UserProfilePropertyObject = this.UserProfileProperties[index];

            if (element && element.Key.toLowerCase() === propertyName) {
                return element.Value;
            }
        }
        return defaultValueIfNotExists || null;
    }
}

export class CurrentUserProfile {

    public static currentUser: PortalUser = null;

    public static readonly cacheKey: string = 'CurrentPortalUser_';

    public static readonly loggingKey: string = 'CurrentUserProfile';

    public static Get(ctx: BaseComponentContext, settings?: any, reload: boolean = false, trygetstored: boolean = false): Promise<PortalUser> {

        const storage: SessionStorage = new SessionStorage();

        const p: Promise<PortalUser> = new Promise<PortalUser>((resolve, reject) => {
            // Logger.Log('Get userprofile', CurrentUserProfile.loggingKey, LogType.Log, enableConsoleLogging);

            if (!reload && !trygetstored && this.currentUser != null) {
                // Logger.Log('current is not null', CurrentUserProfile.loggingKey, LogType.Log, enableConsoleLogging);
                return resolve(this.currentUser);
            }

            const storedUser: any = storage.get(CurrentUserProfile.GetCacheKey(ctx));

            if (!reload && storedUser != null) {
                // Logger.Log('storedUser is not null', CurrentUserProfile.loggingKey, LogType.Log, enableConsoleLogging);
                this.currentUser = new PortalUser();

                for (const key in storedUser) {
                    if (storedUser.hasOwnProperty(key)) {
                        this.currentUser[key] = storedUser[key];
                    }
                }
                return resolve(this.currentUser);
            }

            ctx.spHttpClient
                .get(`${ctx.pageContext.web.absoluteUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`, SPHttpClient.configurations.v1)
                .then((res: SPHttpClientResponse): Promise<CurrentUserProfileRequestResult> => {
                    return res.json();
                },
                (error: any) => {
                    // Logger.Log('Error ocurred in UserProfile.Get()', CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                    // Logger.Log(error, CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                    return reject(error);
                })
                .then((userProperties: CurrentUserProfileRequestResult): any => {
                    const user: PortalUser = new PortalUser();
                    // Logger.Log(userProperties, CurrentUserProfile.loggingKey, LogType.Log, enableConsoleLogging);
                    user.AssignPropertiesFromSPRequest(ctx, userProperties);
                    this.currentUser = user;
                    storage.set(CurrentUserProfile.GetCacheKey(ctx), this.currentUser);
                    return resolve(this.currentUser);
                }).catch((error: any) => {
                    // Logger.Log('Error ocurred in UserProfile.Get()', CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                    // Logger.Log(error, CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                    return reject(error);
                });
        });

        return p;
    }

    public static GetCacheKey(ctx: BaseComponentContext): string {
        const loginName: string = ctx.pageContext.user.loginName.replace(/[^\w\s]/gi, '_');
        return CurrentUserProfile.cacheKey + loginName;
    }

    public static RemoveFromCache(ctx: BaseComponentContext): void {
        const storage: SessionStorage = new SessionStorage();
        const cacheKey: string = CurrentUserProfile.GetCacheKey(ctx);
        storage.remove(cacheKey);
    }
}

export class UserProfile {
    public static readonly Filter: string = 'FirstName,LastName,EMail,WorkPhone,DisplayName,Department,Picture,GUID';
    public FirstName: string;
    public LastName: string;
    public Email: string;
    public WorkPhone: string;
    public DisplayName: string;
    public Department: string;
    public PictureURL: string;
    public Id: string;
    public DelveProfile: string;

    public static ConvertTo(item: any): UserProfile {
        const profile: UserProfile = new UserProfile();
        profile.FirstName = this.GetPropertyByKey(item, 'FirstName');
        profile.LastName = this.GetPropertyByKey(item, 'LastName');
        profile.Email = this.GetPropertyByKey(item, 'WorkEmail');
        profile.WorkPhone = this.GetPropertyByKey(item, 'WorkPhone');
        profile.Department = this.GetPropertyByKey(item, 'Department');
        profile.Id = item.GUID;

        if (item.Picture !== undefined) {
            profile.PictureURL = item.Picture.Url;
        } else {
            profile.PictureURL = item.Picture;
        }

        return profile;
    }

    public static GetUserProfileById(ctx: BaseComponentContext, id: string): Promise<UserProfile> {
        return new Promise<UserProfile>((resolve, reject) => {
            if (ctx == null) {
                return reject('context cannot be null');
            }

            const siteUrl: string = ctx.pageContext.site.absoluteUrl;

            const delvePattern: RegExp = /https:\/\/(.)[^\/]{0,}/;
            const delveEndpoint: string = siteUrl.match(delvePattern)[0];

            id = id.replace(/#/g, '%23');

            const enpointNew: string = siteUrl + `/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=%27` + id + `%27`;

            ctx.spHttpClient.get(enpointNew, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {
                response.json().then((responseJSON: any) => {
                    if (responseJSON === undefined) {
                        return reject(undefined);
                    }

                    const element: any = responseJSON;

                    if (element === undefined || element === null) {
                        return reject(undefined);
                    }

                    const contact: UserProfile = UserProfile.ConvertTo(element);
                    contact.DelveProfile = delveEndpoint + '/_layouts/15/me.aspx/?p=' + contact.Email + '&v=work';

                    // Logger.Log('Returning Contact', 'CurrentUserProfile', LogType.Info, enableConsoleLogging);
                    // Logger.Log(contact, 'CurrentUserProfile', LogType.Info, enableConsoleLogging);

                    return resolve(contact);
                }).catch((error: any) => {
                    // Logger.Log('Error occured in CurrentUserProfile.GetUserProfileById()', CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                    // Logger.Log(error, CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                    return reject(error);
                });
            }).catch((error: any) => {
                // Logger.Log('Error occured in CurrentUserProfile.GetUserProfileById()', CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                // Logger.Log(error, CurrentUserProfile.loggingKey, LogType.Error, enableConsoleLogging);
                return reject(error);
            });
        });
    }

    private static GetPropertyByKey(item: any, key: string): string {
        let value: string = '';

        item.UserProfileProperties.forEach((property: IUserProperty) => {

            if (property.Key === key) {
                value = property.Value;
                return;
            }
        });

        return value;
    }
}

export class CurrentUserProfileRequestResult {

    public DisplayName: string;

    public Email: string;

    public UserProfileProperties: Array<UserProfilePropertyObject>;
}

export interface IUserProperty {
    Key: string;
    Value: string;
    ValueType: string;
}

export class UserProfilePropertyObject {
    public Key: string;
    public Value: any;
    public ValueType: string;
}