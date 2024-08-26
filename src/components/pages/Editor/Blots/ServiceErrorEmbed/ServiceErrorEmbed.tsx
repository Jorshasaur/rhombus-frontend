import * as React from 'react'
import { PersistentBar } from '../PersistentBar'
import Warning from '@invisionapp/helios/icons/Warning'
import { Tooltip } from '@invisionapp/helios'
import { BlockEmbedService } from '../../../../../interfaces/blockEmbed'
import styles from '../PersistentBar.module.css'
import EmbedAnalytics from '../../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'

interface Props {
    service: string
    originalLink: string
    tooltipText: React.ReactNode
    name?: string
}

export class ServiceErrorEmbed extends React.PureComponent<Props> {
    _onWarningClick = () => {
        window.open(this.props.originalLink, '_blank')
        new EmbedAnalytics().onOpenedInNewTab().track()
    }
    render() {
        return (
            <PersistentBar
                service={this.props.service as BlockEmbedService}
                onClick={this._onWarningClick}
                originalLink={this.props.originalLink}
                name={this.props.name}>
                <div className={styles.serviceErrorMessageContainer}>
                    <Tooltip
                        chevron="center"
                        color="dark"
                        placement="top"
                        trigger={
                            <Warning
                                data-allow-propagation="true"
                                onClick={this._onWarningClick}
                                fill="text"
                                // @ts-ignore
                                size={18}
                            />
                        }>
                        {this.props.tooltipText}
                    </Tooltip>
                </div>
            </PersistentBar>
        )
    }
}
