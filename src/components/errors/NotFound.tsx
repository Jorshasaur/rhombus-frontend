import * as React from 'react'
import NotFound from '../../assets/images/not-found.svg'
import InVisionLogo from '../../assets/images/icons/icon-in.svg'
import styles from '../../assets/css/errors/NotFound.module.css'
import { Button, Text } from '@invisionapp/helios'

interface Props {}
interface State {}

export default class Error404 extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
    }

    componentDidMount() {
        // set page title
        document.title = 'Page not found'
    }

    _goHome() {
        window.location.href = '/'
    }

    render() {
        return (
            <div className={styles.notFound} data-test-id="notFoundError">
                <div className={styles.notFoundIllustration}>
                    <NotFound />
                </div>
                <Text element="div" size="smaller" order="title">
                    404. Page not found.
                </Text>
                <div className={styles.notFoundText}>
                    <Text
                        align="center"
                        color="text-lighter"
                        element="div"
                        order="body"
                        size="larger">
                        We've searched high and low, but this page doesn't seem
                        to exist.
                    </Text>
                </div>
                <div className={styles.notFoundButtonContainer}>
                    <Button
                        id="go-home-button"
                        order="primary"
                        size="larger"
                        reversed={false}
                        className={styles.notFoundButton}
                        onClick={this._goHome}>
                        Take me home
                    </Button>
                </div>
                <a className={styles.notFoundLogo} href="/">
                    <InVisionLogo />
                </a>
            </div>
        )
    }
}
