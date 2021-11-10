import * as React from 'react';
import styles from './FirstWp.module.scss';
import { SPFxAppDevWebPartComponent, ISPFxAppDevWebPartComponentProps } from '@spfxappdev/framework';
import FirstWpWebPart from '../FirstWpWebPart';

interface IFirstWpState {

}

export interface IFirstWpProps extends ISPFxAppDevWebPartComponentProps<FirstWpWebPart> {
}

export default class FirstWp extends SPFxAppDevWebPartComponent<FirstWpWebPart, IFirstWpProps, IFirstWpState> {
  
  public static defaultProps: IFirstWpProps = {
    Title: "",
    WebPart: null,
  };
  
  public state: IFirstWpState = {};

  constructor(props: IFirstWpProps) {
    super(props);
  }

  public render(): React.ReactElement<IFirstWpProps> {
    return (
      <div className={this.cssClasses(styles.firstWp)}>
        Hello and welcome to FirstWp
      </div>
    );
  }
}