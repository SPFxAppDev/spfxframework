import { isNullOrEmpty, getDeepOrDefault,  isset, isFunction } from '@spfxappdev/utility';

export interface IPlaceholderResolver {
  placeHolderData: any;
}

export class PlaceholderHandler {

    protected Resolver: IPlaceholderResolver[] = [];

    public Register(resolver: IPlaceholderResolver): void {

      if (!isset(resolver)) {
        return;
      }

      this.Resolver.push(resolver);
    }

    public Replace(stringToReplace: string): string {
        const self: PlaceholderHandler = this;

        if (isNullOrEmpty(this.Resolver)) {
          return stringToReplace;
        }

        self.Resolver.forEach((resolver: IPlaceholderResolver) => {

          stringToReplace = stringToReplace.replace(/\{([\w\.]*)\}/g, (placeholderMatch, placeholderKey): string => {

            const placeholderValue: any = getDeepOrDefault(resolver.placeHolderData, placeholderKey);

            if (!isset(placeholderValue)) {
              return placeholderMatch;
            }

            if (isFunction(placeholderValue)) {
              return placeholderValue.apply(resolver.placeHolderData, null);
            }

            return placeholderValue;
          });
        });

        return stringToReplace;
    }
}