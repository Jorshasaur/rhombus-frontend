import React from 'react'
import { Subscribe } from 'unstated'
import cx from 'classnames'
import { BlockEmbedProps } from '../../../../interfaces/blockEmbed'
import FileEmbedContainer from './FileEmbedContainer'
import { AnimatedEmbedWrapper } from './AnimatedEmbedWrapper'
import styles from './Blots.module.css'
import { get } from 'lodash'
import { BlotSize } from '../../../../interfaces/blotSize'
import { getEmbedSize } from '../../../../helpers/EmbedHelper'
import { PersistentBar } from './PersistentBar'
import { Timestamp } from './Timestamp'
import { Asset } from '../../../../interfaces/asset'
import { Skeleton } from '@invisionapp/helios'
import { DEFAULT_RATIO } from '../../../../constants/styles'
import videoJS from 'video.js'
import { improveVideoScrubbing } from '../../../../lib/utils'
import '!style-loader!css-loader!video.js/dist/video-js.css'
import './Video.css'

interface Props extends BlockEmbedProps {
    container: HTMLElement
}

interface VideoProps {
    asset: Asset
}

class Video extends React.Component<VideoProps> {
    videoRef = React.createRef<HTMLVideoElement>()

    componentDidMount() {
        if (this.videoRef.current != null) {
            improveVideoScrubbing()
            const video = videoJS(this.videoRef.current, {
                fluid: true,
                liveui: true
            })
            video.aspectRatio('16:9')
        }
    }

    getContentType(asset: Asset) {
        if (asset.contentType === 'video/quicktime') {
            return 'video/mp4'
        } else {
            return asset.contentType
        }
    }

    render() {
        const { asset } = this.props

        return (
            <React.Fragment>
                <div className={styles.extendedInfo}>
                    <video
                        controls
                        className={cx(
                            'video-js',
                            'vjs-big-play-centered',
                            styles.video
                        )}
                        ref={this.videoRef}>
                        <source
                            src={`${asset.url}?filename=${asset.fileName}`}
                            type={this.getContentType(asset)}
                        />
                    </video>
                </div>
            </React.Fragment>
        )
    }
}

export default class VideoEmbed extends React.Component<Props> {
    _renderPlaceholder = () => {
        return (
            <div className={styles.extendedInfo}>
                <Skeleton ratio={DEFAULT_RATIO} />
            </div>
        )
    }

    _renderFullSize = (embed: FileEmbedContainer) => {
        const { asset, embedData } = embed.state
        return (
            <React.Fragment>
                <div
                    className={cx(
                        styles.blockEmbedWrapper,
                        this.props.service,
                        this.props.uuid
                    )}>
                    {asset ? (
                        <Video asset={asset} />
                    ) : (
                        this._renderPlaceholder()
                    )}
                </div>
                <PersistentBar
                    service={this.props.service}
                    originalLink={this.props.originalLink}
                    name={get(asset, 'fileName') || embedData.fileName}
                    hoverChildren={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Timestamp
                                author={this.props.authorName}
                                className={styles.persistentTimestamp}
                                createdAt={this.props.createdAt}
                            />
                        </div>
                    }
                />
            </React.Fragment>
        )
    }

    render() {
        return (
            <Subscribe to={[FileEmbedContainer]}>
                {(embed: FileEmbedContainer) => {
                    return (
                        <AnimatedEmbedWrapper
                            renderFullSize={() => this._renderFullSize(embed)}
                            size={embed.state.size || BlotSize.Medium}
                            container={this.props.container}
                            getEmbedSize={() =>
                                getEmbedSize(this, styles.extendedInfo)
                            }
                            hasOpenThread={embed.state.hasOpenThread || false}
                        />
                    )
                }}
            </Subscribe>
        )
    }
}
