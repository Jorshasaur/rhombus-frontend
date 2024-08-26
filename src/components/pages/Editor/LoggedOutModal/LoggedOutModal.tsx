import * as React from 'react'
import { Text, Padded, Spinner } from '@invisionapp/helios'
import styles from './LoggedOutModal.module.css'

interface Props {
    pendingEdits: boolean
    keepAlivePending: boolean
    retry: () => void
}
interface State {}

export default class LoggedOutModal extends React.Component<Props, State> {
    render() {
        const { pendingEdits, keepAlivePending, retry } = this.props
        let headline = (
            <Text align="center" element="h2" order="title" size="smaller">
                You've been logged out.
                <br />
                Please log in again.
            </Text>
        )

        if (pendingEdits) {
            headline = (
                <Text align="center" element="h2" order="title" size="smaller">
                    You've been logged out with unsynced changes.
                    <br />
                    Don't close this tab!
                </Text>
            )
        }

        return (
            <React.Fragment>
                {headline}
                <Padded bottom="l">
                    <Text align="center" order="body" size="smaller">
                        1. Open a NEW InVision tab.
                        <br />
                        (Be sure to use the correct subdomain)
                        <br />
                        <br />
                        2. Log in.
                        <br />
                        <br />
                        3. Return to this tab. All should be well. <br />
                        <br />
                        Note: if you've logged in, and this modal is still
                        present, <a onClick={retry}>click here.</a>
                        {keepAlivePending && (
                            <Spinner
                                className={styles.keepAlivePendingSpinner}
                            />
                        )}
                    </Text>
                </Padded>
            </React.Fragment>
        )
    }
}
