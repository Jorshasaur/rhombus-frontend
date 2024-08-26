import { Button } from '@invisionapp/helios'
import Close from '@invisionapp/helios/icons/Close'
import Invision from '@invisionapp/helios/icons/InVision'
import * as React from 'react'
import TimeAgo from 'react-timeago'
import { formatTime } from '../../../../../lib/utils'
import styles from './ExpandedImageHeader.module.css'

interface Props {
    fileName: string
    createdAt?: string
    author: string
    onClose: () => void
}

export default class ExpandedImageHeader extends React.Component<Props> {
    constructor(props: Props) {
        super(props)
    }

    stopEvents = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation()
    }

    render() {
        return (
            <div className={styles.ExpandedImageHeader}>
                <button
                    data-testid="expanded-image-header__close-button"
                    className={styles.closeButton}
                    onClick={() => {
                        this.props.onClose()
                    }}>
                    <Close />
                </button>
                <Invision className={styles.logo} />
                <div className={styles.fileContainer}>
                    <p className={styles.fileName}>{this.props.fileName}</p>
                    <p className={styles.author}>
                        Added by {this.props.author + ' '}
                        {this.props.createdAt && (
                            <TimeAgo
                                date={this.props.createdAt}
                                formatter={(
                                    value: number,
                                    unit: string,
                                    suffix: string,
                                    date: Date
                                ) =>
                                    formatTime(
                                        value,
                                        unit,
                                        suffix,
                                        date,
                                        'just now'
                                    )
                                }
                            />
                        )}
                    </p>
                </div>
                <Button
                    id="download-button"
                    order="primary"
                    reversed={false}
                    className={styles.expandedDownload}
                    onClick={() => {
                        return
                    }}>
                    <a
                        href={''}
                        target="_blank"
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                            this.stopEvents(e)
                        }
                        download={this.props.fileName}>
                        Download
                    </a>
                </Button>
            </div>
        )
    }
}
