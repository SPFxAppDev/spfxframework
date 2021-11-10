import { IPlaceholderResolver } from './PlaceholderHandler';

export class CommonPlaceholderResolver implements IPlaceholderResolver {

  public placeHolderData: any;

  public constructor(data: any) {
    this.placeHolderData = data;
  }
}