import { PageContext } from '@microsoft/sp-page-context';
import { IPlaceholderResolver } from './PlaceholderHandler';

export class SPPlaceholderResolver implements IPlaceholderResolver {

  public context: PageContext;

  public placeHolderData: any = {
    Web: {
      Url(): string {
        return this.context.web.absoluteUrl;
      },
      Id(): string {
        return this.context.web.id;
      },
      Title(): string {
        return this.context.web.title;
      },
      RelativeUrl(): string {
        return this.context.web.serverRelativeUrl;
      }
    },
    Site: {
        Url(): string {
          return this.context.site.absoluteUrl;
        },
        Id(): string {
          return this.context.site.id;
        },
        RelativeUrl(): string {
          return this.context.site.serverRelativeUrl;
        }
    },
    User: {
        Name(): string {
            return this.context.user.displayName;
        },
        Email(): string {
            return this.context.user.email;
        },
        LoginName(): string {
            return this.context.user.loginName;
        }
    }
  };

  public constructor(pageContext: PageContext) {
    this.context = pageContext;
    this.placeHolderData.context = this.context;
  }
}