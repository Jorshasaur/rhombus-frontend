import * as React from 'react'
import Cookie from 'js-cookie'
import { Dialog, Text } from '@invisionapp/helios'
import {
    RHOMBUS_PRIVACY_COOKIE_KEY,
    RHOMBUS_PRIVACY_COOKIE_TTL
} from '../../../../constants/general'
interface Props {}
interface State {
    showPrivacyDisclaimer: boolean
}

export class PrivacyDisclaimer extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
            showPrivacyDisclaimer: true
        }
    }

    render() {
        const { showPrivacyDisclaimer } = this.state
        return (
            <Dialog
                aria-label="Welcome to Docs"
                onAfterClose={this._setCookie}
                onRequestClose={this._hidePrivacyDisclaimer}
                negativeText=""
                positiveText="Got it"
                open={showPrivacyDisclaimer}
                className="privacy-dialog">
                <Text align="left" element="h2" order="title" size="smaller">
                    Welcome to Docs
                </Text>
                <Text align="left" element="p" order="body">
                    As a top InVision customer, you get access to our latest
                    experiment: Docs, a place for you to create design-forward
                    documents.
                </Text>
                <Text align="left" element="p" order="body">
                    <strong>Docs is top secret for now.</strong> Chatting about
                    this with people outside your organization is against our{' '}
                    <a
                        href="https://www.invisionapp.com/about/terms-of-service/"
                        target="_blank">
                        Terms of Service
                    </a>
                    , so please keep those lips sealed.
                </Text>
                <Text align="left" element="p" order="body">
                    While we can't take responsibility for lost data while Docs
                    is in beta, we are confident that you'll have a smooth,
                    stable experience.
                </Text>
                <Text align="left" element="p" order="body">
                    Thanks for helping us create the best products possible.
                    Questions, comments, or feedback? Our Product Manager,
                    Chris, is standing by at{' '}
                    <a
                        href="mailto:chrishlavaty@invisionapp.com"
                        target="_blank">
                        chrishlavaty@invisionapp.com.
                    </a>
                </Text>
            </Dialog>
        )
    }

    private _setCookie = () => {
        Cookie.set(RHOMBUS_PRIVACY_COOKIE_KEY, 'true', {
            expires: RHOMBUS_PRIVACY_COOKIE_TTL
        })
    }
    private _hidePrivacyDisclaimer = () => {
        this.setState({ showPrivacyDisclaimer: false })
    }
}
