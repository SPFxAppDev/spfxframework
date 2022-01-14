import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { ISPFxAppDevClientSideWebPartProps, SPFxAppDevClientSideWebPart } from '@spfxappdev/framework';
// import { ISPFxAppDevClientSideWebPartProps, SPFxAppDevClientSideWebPart } from '../../../../lib';
import FirstWp,  { IFirstWpProps } from './components/FirstWp';

export interface IFirstWpWebPartProps extends ISPFxAppDevClientSideWebPartProps {

}


export default class FirstWpWebPart extends SPFxAppDevClientSideWebPart<IFirstWpWebPartProps> {
    public render(): void {
        const element: React.ReactElement<IFirstWpProps> = React.createElement(
            FirstWp,
            {
                WebPart: this,
                Title: this.properties.Title
            }
        );

        ReactDom.render(element, this.domElement);
    }

    public getLogCategory(): string {
        return 'FirstWpWebPart';
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement);
    }

    // protected get dataVersion(): Version {
    //     return Version.parse('1.0');
    // }

    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
      return {
        pages: [
        {
          header: {
            description: ''
          },
          groups: [
            {
            groupName: '',
            groupFields: [
              PropertyPaneTextField('Title', {
                label: 'Titel'
              })
            ]
            }
          ]
        }
        ]
      };
    }
}