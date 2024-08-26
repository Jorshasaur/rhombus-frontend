import * as React from 'react'
import { includes, startsWith } from 'lodash'
import URI from 'urijs'
import { BlockEmbedProps } from '../../../../interfaces/blockEmbed'
import styles from './Blots.module.css'
import ratioSixteenByNine from '../../../../assets/images/embeds/clear16x9.png'
import ratioSixteenByTen from '../../../../assets/images/embeds/clear16x10.png'

interface Props extends BlockEmbedProps {
    originalLink: string
}

export default class DirectIframeBlockEmbed extends React.Component<Props> {
    constructor(props: any) {
        super(props)
    }
    componentWillMount() {
        if (this.props.service === 'linkedin' && !window.IN) {
            const script = document.createElement('script')
            script.src = '//platform.linkedin.com/in.js'
            document.body.appendChild(script)
        }
    }
    componentDidMount() {
        if (this.props.service === 'linkedin' && window.IN) {
            const IN = window.IN
            IN.Event.onOnce(IN, 'systemReady', () => {
                IN.parse()
            })
        }
    }
    render() {
        return (
            <div
                className={`
                    ${styles.blockEmbedWrapper}
                    ${this.props.service ? styles[this.props.service] : ''}
                    ${this.props.uuid}
                `}>
                <div className={styles.directEmbedIframeWrapper}>
                    <img
                        className={styles.ratio}
                        src={
                            includes(['youtube', 'vimeo'], this.props.service)
                                ? ratioSixteenByNine
                                : ratioSixteenByTen
                        }
                    />
                    {this._renderServiceIframe()}
                </div>
            </div>
        )
    }
    _getVideoId() {
        const uri = URI(this.props.originalLink)
        const params = new URLSearchParams(uri.query())

        switch (this.props.service) {
            case 'youtube':
                if (startsWith(uri.path(), '/watch')) {
                    return params.get('v')
                }

                if (uri.domain() === 'youtu.be') {
                    return uri.path()
                }

                if (
                    startsWith(uri.path(), '/v/') ||
                    startsWith(uri.path(), '/embed/')
                ) {
                    return uri.path().split('/')[2]
                }

                return
            case 'vimeo':
                if (!isNaN(parseInt(uri.path().replace('/', ''), 10))) {
                    return uri.path().replace('/', '')
                }

                if (startsWith(uri.path(), '/video/')) {
                    return uri.path().split('/')[2]
                }
                return
            default:
                return
        }
    }

    _renderYoutubeIframe() {
        return (
            <iframe
                src={'https://www.youtube.com/embed/' + this._getVideoId()}
                frameBorder="0"
            />
        )
    }

    _renderVimeoIframe() {
        return (
            <iframe
                src={'https://player.vimeo.com/video/' + this._getVideoId()}
                frameBorder="0"
            />
        )
    }

    _renderSoundCloudIframe() {
        return (
            <iframe
                src={
                    'https://w.soundcloud.com/player/?url=' +
                    this.props.originalLink +
                    '&autoplay=false'
                }
                frameBorder="0"
            />
        )
    }

    _renderSpotifyIframe() {
        return (
            <iframe
                src={
                    'https://embed.spotify.com/?uri=' + this.props.originalLink
                }
                frameBorder="0"
            />
        )
    }

    _renderLinkedInIframe() {
        var uri = URI(this.props.originalLink),
            cardType = startsWith(uri.path(), '/company/')
                ? 'IN/CompanyProfile'
                : 'IN/MemberProfile'

        return (
            <div
                className={`${styles.linkedinFrame} ${
                    cardType === 'IN/CompanyProfile'
                        ? styles.linkedinCompany
                        : null
                }`}>
                <script
                    type={cardType}
                    data-id={this.props.originalLink}
                    data-format="inline"
                    data-related="false"
                />
            </div>
        )
    }

    private _renderServiceIframe() {
        switch (this.props.service) {
            case 'youtube':
                return this._renderYoutubeIframe()
            case 'vimeo':
                return this._renderVimeoIframe()
            case 'soundcloud':
                return this._renderSoundCloudIframe()
            case 'spotify':
                return this._renderSpotifyIframe()
            case 'linkedin':
                return this._renderLinkedInIframe()
            default:
                return
        }
    }
}
