import { Banner, Button } from '@invisionapp/helios'
import CheckSmaller from '@invisionapp/helios/icons/CheckSmaller'
import Warning from '@invisionapp/helios/icons/Warning'
import cx from 'classnames'
import PubSub from 'pubsub-js'
import React from 'react'
import { AnyAction } from 'redux'
import { RESET_DOC_MESSAGE } from '../../../constants/messages'
import {
    DOCUMENT_EVENT_RECONNECT,
    DOCUMENT_EVENT_RESET
} from '../../../constants/topics'
import {
    BannerPosition,
    BannerState,
    BannerType
} from '../../../data/reducers/banner'
import styles from './Banner.module.css'

interface Props {
    banner: BannerState
    navigationHeight: number
    hideBanner: () => AnyAction
}

export default class BannerWrapper extends React.Component<Props> {
    _resetDoc = () => {
        this.props.hideBanner()
        PubSub.publish(DOCUMENT_EVENT_RESET, null)
    }

    _renderResetDoc() {
        return (
            <React.Fragment>
                {RESET_DOC_MESSAGE}
                <Button
                    id="reset-doc"
                    data-testid="reset-doc"
                    order="secondary"
                    size="smaller"
                    reversed={true}
                    className={styles.refreshButton}
                    onClick={this._resetDoc}>
                    Refresh
                </Button>
            </React.Fragment>
        )
    }

    _renderConnectionLostWarn() {
        return (
            <div className={styles.messageWrap}>
                <Warning fill="warning" className={styles.warningIcon} />
                Connection lost. Your changes will sync once the connection has
                been restored.
            </div>
        )
    }

    _tryReconnect = () => {
        PubSub.publish(DOCUMENT_EVENT_RECONNECT, null)
    }

    _renderConnectionLostError() {
        return (
            <div className={styles.messageWrap}>
                <Warning fill="danger" className={styles.warningIcon} />
                We can’t reconnect. Please restore your connection to continue
                editing. <a onClick={this._tryReconnect}>Try now</a>
            </div>
        )
    }

    _renderTryingReconnect() {
        return (
            <div className={styles.messageWrap}>
                <Warning fill="danger" className={styles.warningIcon} />
                Trying to reconnect…
            </div>
        )
    }

    _renderReconnectSuccess() {
        return (
            <div className={styles.messageWrap}>
                <CheckSmaller fill="success" className={styles.successIcon} />
                Success! Your connection has been restored.
            </div>
        )
    }

    _renderBannerType(bannerType: BannerType) {
        switch (bannerType) {
            case BannerType.RESET_DOC:
                return this._renderResetDoc()
            case BannerType.CONNECTION_LOST_WARN:
                return this._renderConnectionLostWarn()
            case BannerType.CONNECTION_LOST_ERROR:
                return this._renderConnectionLostError()
            case BannerType.TRYING_RECONNECT:
                return this._renderTryingReconnect()
            case BannerType.RECONNECT:
                return this._renderReconnectSuccess()
            default:
                return 'Unknown type'
        }
    }

    render() {
        const { type, color, position } = this.props.banner

        if (type == null || color == null) {
            return null
        }

        const hasButton = type === BannerType.RESET_DOC
        const style: React.CSSProperties = {}
        if (position === BannerPosition.Bottom) {
            style.top = this.props.navigationHeight
        }

        return (
            <Banner
                id="top-banner"
                style={style}
                className={cx(styles.banner, {
                    [styles.hasButton]: hasButton,
                    [styles.success]: type === BannerType.RECONNECT,
                    [styles.warning]: type === BannerType.CONNECTION_LOST_WARN,
                    [styles.error]:
                        type === BannerType.CONNECTION_LOST_ERROR ||
                        type === BannerType.TRYING_RECONNECT
                })}
                // @ts-ignore
                background={color}>
                {this._renderBannerType(type)}
            </Banner>
        )
    }
}
