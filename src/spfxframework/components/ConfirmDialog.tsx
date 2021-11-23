import * as React from 'react';
import * as ReactDOM from "react-dom";
import { Dialog, DialogType, PrimaryButton, DialogFooter, DefaultButton } from 'office-ui-fabric-react';
import { Guid } from "@microsoft/sp-core-library";


export interface IErrorItem {
    Error: any;
    Message: string;
}

export interface IConfirmDialogProps {
    content: string;
    title?: string;
    isOpen?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm?:() => void;
    onDismiss?:() => void;
}

export interface IConfirmDialogState {
    isOpen: boolean;
}

export default class ConfirmDialog extends React.Component<IConfirmDialogProps, IConfirmDialogState> {

    public static defaultProps: IConfirmDialogProps = {
        content: "",
        isOpen: true,
        confirmButtonText: "Ok",
        cancelButtonText: "Cancel"
    };

    public static open(props: IConfirmDialogProps): void {
        const container: HTMLDivElement = document.createElement('div');
        container.id = Guid.newGuid().toString();
        document.body.appendChild(container);

        const originalOnConfirm = props.onConfirm;
        const originalOnDismiss = props.onDismiss;

        props.onConfirm = () => {
            document.body.removeChild(container);

            if(originalOnConfirm) {
                originalOnConfirm();
            }
        };

        props.onDismiss = () => {
            document.body.removeChild(container);

            if(originalOnDismiss) {
                originalOnDismiss();
            }
        };

        const element: React.ReactElement<IConfirmDialogProps> = React.createElement(
            ConfirmDialog, props
        );

        ReactDOM.render(element, container);
    }

    public state: IConfirmDialogState = {
        isOpen: this.props.isOpen
    };

    public render(): JSX.Element {

        return (
            <Dialog
            hidden={!this.state.isOpen}
            onDismiss={() => { this.onDismiss(); }}
            dialogContentProps={
                {
                    title: this.props.title,
                    type: DialogType.normal,
                    subText: this.props.content
                }
            }
            modalProps={{
                isBlocking: true,
            }}
          >
            <DialogFooter>
              <PrimaryButton onClick={() => { this.onConfirm(); }} text={this.props.confirmButtonText} />
              <DefaultButton onClick={() => { this.onDismiss(); }} text={this.props.cancelButtonText} />
            </DialogFooter>
          </Dialog>
        );
    }

    private onConfirm(): void {
        this.setState({isOpen: !this.state.isOpen});

        if(this.props.onConfirm) {
            this.props.onConfirm();
        }
    }

    private onDismiss(): void {
        this.setState({isOpen: !this.state.isOpen});

        if(this.props.onDismiss) {
            this.props.onDismiss();
        }
    }
}