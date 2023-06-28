import { SPUri } from '../utility/UrlHelper';
import { isset, issetDeep, isFunction, isNullOrEmpty, toBoolean, getUrlParameter, extend, cssClasses, getDeepOrDefault } from '@spfxappdev/utility';

export interface ISPFxAppDevBaseHelper {
    url: SPUri;
    functions: GeneralHelper;
}

export class GeneralHelper {
  public isset: (property: any) => boolean = isset;

  public issetDeep: (objectToCheck: any, keyNameSpace: string) => boolean =
    issetDeep;

  public isNullOrEmpty: (property: any) => boolean = isNullOrEmpty;

  public isFunction: (property: any) => boolean = isFunction;

  public toBoolean: (value: any) => boolean = toBoolean;

  public getUrlParameter: (
    parameterName: string,
    url?: string
  ) => string | null = getUrlParameter;

  public getDeepOrDefault: <T>(
    objectToCheck: any,
    keyNameSpace: string,
    defaultValue?: T
  ) => T = getDeepOrDefault;

  public extend: (
    target: any,
    source: any,
    inCaseOfArrayUseSourceObject?: boolean
  ) => any = extend;

  public cssClasses: (...args: any[]) => string = cssClasses;
}