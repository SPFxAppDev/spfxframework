import { IPlaceholderResolver } from './PlaceholderHandler';
import { PortalUser, UserProfilePropertyObject } from '../sp/userprofile/CurrentUserProfile';

export class UserProfilePlaceholderResolver implements IPlaceholderResolver {

  public profile: PortalUser;

  public placeHolderData: any = {
  };

  public constructor(userProfile: PortalUser) {
    this.profile = userProfile;

    if (!this.profile.UserProfileProperties) {
      return;
    }

    this.placeHolderData.UserProfile = {};

    for (let index: number = 0; index < this.profile.UserProfileProperties.length; index++) {
        const element: UserProfilePropertyObject = this.profile.UserProfileProperties[index];
        if (element && typeof element.Key == "string" && typeof element.Value == "string") {
          this.placeHolderData.UserProfile[element.Key.replace(/[\W_]+/g, "")] = element.Value;
        }
    }
  }
}