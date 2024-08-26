import cx from 'classnames'
import { debounce } from 'lodash'
import PubSub from 'pubsub-js'
import React, { Component } from 'react'
import { PERSISTENT_BAR_HEIGHT } from '../../../../constants/styles'
import {
    DOCUMENT_CHANGE_REPOSITION,
    DOCUMENT_CHANGE_UPDATE
} from '../../../../constants/topics'
import { getEmbedStyles } from '../../../../helpers/EmbedHelper'
import { BlotSize } from '../../../../interfaces/blotSize'
import { calculateAspectRatio } from '../../../../lib/utils'
import styles from './AnimatedEmbedWrapper.module.css'

interface Props {
    renderSmall?: () => React.ReactNode
    renderFullSize: (width: number) => React.ReactNode
    size: BlotSize
    getEmbedSize: () => { height: number; width: number }
    container: HTMLElement
    maxHeight?: number
    popoutOpen?: boolean
    hasOpenThread: boolean
    onTransitionEnd: () => void
}
interface State {
    height: React.CSSProperties['height']
    left?: React.CSSProperties['left']
    width?: React.CSSProperties['width']
    opacity: React.CSSProperties['opacity']
    overflow: React.CSSProperties['overflow']
    pointerEvents: React.CSSProperties['pointerEvents']
}
export class AnimatedEmbedWrapper extends Component<Props, State> {
    static defaultProps = {
        onTransitionEnd: () => undefined
    }

    state: State = {
        opacity: 0,
        overflow: 'hidden',
        height: PERSISTENT_BAR_HEIGHT,
        pointerEvents: 'none'
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if (props.size === BlotSize.Medium || props.size === BlotSize.Large) {
            const {
                height,
                width,
                left
            } = AnimatedEmbedWrapper.getWrapperStyles(props)
            return {
                height: height + PERSISTENT_BAR_HEIGHT,
                width,
                left,
                opacity: 1,
                pointerEvents: 'unset'
            }
        } else {
            return {
                height: PERSISTENT_BAR_HEIGHT,
                left: 0,
                width: '100%',
                opacity: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }
        }
    }

    static getWrapperStyles = (props: Props) => {
        const embedSize = props.getEmbedSize()
        const aspect = calculateAspectRatio(embedSize.width, embedSize.height)
        const container = props.container
        const embedStyles = getEmbedStyles(
            aspect,
            container,
            props.size,
            props.hasOpenThread
        )
        let height = embedStyles.height
        if (props.maxHeight && height > props.maxHeight) {
            height = props.maxHeight
        }
        return {
            height,
            left: embedStyles.left,
            width: embedStyles.width
        }
    }
    componentDidMount() {
        window.addEventListener('resize', this.handleResize)
        this.handleResize()
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
        if (prevState.height !== this.state.height) {
            setTimeout(() => {
                this.props.onTransitionEnd()
                PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)
                PubSub.publish(DOCUMENT_CHANGE_REPOSITION, null)
            }, 300)
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize)
    }

    handleResize = debounce(() => {
        if (
            this.props.size === BlotSize.Medium ||
            this.props.size === BlotSize.Large
        ) {
            const {
                height,
                width,
                left
            } = AnimatedEmbedWrapper.getWrapperStyles(this.props)
            this.setState({
                height: height + PERSISTENT_BAR_HEIGHT,
                left,
                width
            })
        }
    }, 50)

    handleTransitionEnd = () => {
        this.setState({
            overflow:
                this.props.size === BlotSize.Medium ||
                this.props.size === BlotSize.Large
                    ? 'visible'
                    : 'hidden'
        })
    }

    render() {
        const { renderSmall, renderFullSize } = this.props

        return (
            <div
                data-testid={`animated-embed-wrapper__${this.props.size}`}
                onTransitionEnd={this.handleTransitionEnd}
                className={cx(styles.container, {
                    [styles.popoutClosed]:
                        this.props.size === BlotSize.Large &&
                        !this.props.popoutOpen
                })}
                style={{
                    height: this.state.height,
                    overflow: this.state.overflow,
                    width: this.state.width,
                    left: this.state.left
                }}>
                {typeof renderSmall === 'function' && (
                    <div className={styles.small}>{renderSmall()}</div>
                )}
                <div
                    className={styles.medium}
                    style={{
                        opacity: this.state.opacity,
                        pointerEvents: this.state.pointerEvents
                    }}>
                    {/* When resized to medium or large, the width will always be a number */}
                    {renderFullSize(this.state.width as number)}
                </div>
            </div>
        )
    }
}
