import { Popover, Zoom } from '@invisionapp/helios'
import { ObjectFitProperty } from 'csstype'
import { EventEmitter2 } from 'eventemitter2'
import { debounce, noop } from 'lodash'
import PubSub from 'pubsub-js'
import * as React from 'react'
import store from '../../../../../data/store'
import { BlotSize } from '../../../../../interfaces/blotSize'
import { SOCKET } from '../../../../../constants/network'
import { isMacLike } from '../../../../../lib/utils'
import styles from './FreehandCanvas.module.css'
import FreehandEmbedContainer from './FreehandEmbedContainer'

interface Canvas extends EventEmitter2 {
    updateContent: (content?: ArrayBuffer, assets?: Props['assets']) => void
    updateSize: () => void
    camera: {
        x: number
        y: number
        scale: number
    }
    redraw: () => void
    zoomIn: () => void
    zoomOut: () => void
    resetViewport: () => void
}

interface Props {
    freehand: FreehandEmbedContainer
    id: string | undefined
    content?: ArrayBuffer
    assets?: { [uuid: string]: string }
    onZoom: () => void
    onPan: () => void
}

interface State {
    initialized: boolean
    zoom: number
    objectFit: ObjectFitProperty
}

export default class FreehandCanvas extends React.Component<Props, State> {
    static defaultProps = {
        onZoom: noop,
        onPan: noop
    }
    canvas: HTMLCanvasElement
    freehandCanvas: Canvas
    height: number

    constructor(props: Props) {
        super(props)

        this.state = {
            initialized: false,
            zoom: 100,
            objectFit: this.getObjectFit()
        }
    }

    componentDidMount() {
        const { freehand } = this.props

        PubSub.subscribe(
            SOCKET.freehandDocumentUpdated,
            debounce((_event: string, freehandDocumentId: number) => {
                if (freehandDocumentId === freehand.state.id) {
                    freehand.setState({ updateAvailable: true })
                }
            }, 1000)
        )

        const useNightlyFeatures = store.getState().featureFlags.nightly

        if (useNightlyFeatures) {
            const setProperty = (p: string, v: string) =>
                document.documentElement.style.setProperty(p, v)
            const getPropertyValue = (x: string) =>
                getComputedStyle(document.documentElement).getPropertyValue(x)

            setProperty(
                '--color-freehand-zoom',
                getPropertyValue('--color-ink-darkest')
            )

            setProperty(
                '--color-freehand-zoom-text',
                getPropertyValue('--color-structure-light')
            )

            setProperty(
                '--freehand-canvas-filter',
                'contrast(0.9) saturate(0.8)'
            )
        }

        setTimeout(async () => {
            // this is a huge file, so we import it dynamically only when we need it
            const { FreehandCanvas2D } = await import(
                '@invisionapp/freehand-canvas-2d'
            )

            this.freehandCanvas = new FreehandCanvas2D(this.canvas, {
                allowPanning: false,
                allowZooming: true,
                allowDragging: true,
                allowCmdZooming: true,
                useTransparentBackground: useNightlyFeatures
            })
            if (this.props.content) {
                this.height = this.canvas.offsetHeight
                this.freehandCanvas.updateSize()
                this.freehandCanvas.updateContent(
                    this.props.content,
                    this.props.assets
                )
            }

            this.setState({ initialized: true })

            this.freehandCanvas.on('zoom', debounce(this.props.onZoom, 500))
            this.freehandCanvas.on('panning', debounce(this.props.onPan, 500))
            this.freehandCanvas.on('zoom', debounce(this.limitZoom, 50))
            this.freehandCanvas.on('viewport', this.limitZoom)
        })
    }

    componentDidUpdate(prevProps: Props) {
        if (
            this.state.initialized &&
            prevProps.content !== this.props.content
        ) {
            this.height = this.canvas.offsetHeight
            this.freehandCanvas.updateSize()
            this.freehandCanvas.updateContent(
                this.props.content,
                this.props.assets
            )
        }
    }

    componentWillUnmount() {
        PubSub.unsubscribe(SOCKET.freehandDocumentUpdated)
        if (this.freehandCanvas) {
            this.freehandCanvas.removeAllListeners()
        }
    }

    limitZoom = () => {
        let redraw = false

        if (this.freehandCanvas.camera.scale < 0) {
            this.freehandCanvas.camera.scale = 0
            redraw = true
        } else if (this.freehandCanvas.camera.scale > 64) {
            this.freehandCanvas.camera.scale = 64
            redraw = true
        }

        this.setState({
            zoom: Math.round(this.freehandCanvas.camera.scale * 100)
        })

        if (redraw) {
            this.freehandCanvas.redraw()
        }
    }

    zoomIn = () => {
        if (this.freehandCanvas) {
            this.freehandCanvas.zoomIn()
            this.props.onZoom()
        }
    }

    zoomOut = () => {
        if (this.freehandCanvas) {
            this.freehandCanvas.zoomOut()
            this.props.onZoom()
        }
    }

    recenter = () => {
        if (this.freehandCanvas) {
            this.freehandCanvas.resetViewport()
        }
    }

    getObjectFit(): ObjectFitProperty {
        if (this.props.freehand.state.size === BlotSize.Large) {
            return 'cover'
        }
        return 'contain'
    }

    updateSize = (maintainScale: boolean = false) => {
        if (this.freehandCanvas) {
            if (maintainScale && this.height !== this.canvas.offsetHeight) {
                const scaleFactor = this.height / this.canvas.offsetHeight
                this.freehandCanvas.camera.scale /= scaleFactor
                this.height = this.canvas.offsetHeight
            }
            this.freehandCanvas.updateSize()

            this.setState({ objectFit: this.getObjectFit() })
        }
    }

    render() {
        const id = 'freehandcanvas-' + this.props.id
        const zoomHelperText = `${isMacLike() ? '⌘' : 'Ctrl'} + Scroll`

        return (
            <div className={styles.FreehandCanvas}>
                <canvas
                    id={id}
                    style={{
                        objectFit: this.state.objectFit,
                        filter: 'var(--freehand-canvas-filter)'
                    }}
                    ref={(el: HTMLCanvasElement) => {
                        this.canvas = el
                    }}
                />
                <div
                    className={`FreehandCanvas__zoom ${styles.zoom}`}
                    onMouseDown={(e: React.MouseEvent) => {
                        // Needed to prevent embed from being unselected while clicking button
                        e.preventDefault()
                    }}>
                    <div
                        className={styles.centerButton}
                        data-testid="FreehandCanvas__center-button"
                        onDoubleClick={this.recenter}
                    />
                    <Popover
                        chevron="center"
                        placement="top"
                        showOn="hover"
                        className={styles.popover}
                        trigger={
                            <Zoom
                                onZoomIn={this.zoomIn}
                                onZoomOut={this.zoomOut}
                                tooltipPlacement="top"
                                withTooltip={false}
                                zoomLevel={`${this.state.zoom}%`}
                            />
                        }>
                        <div>{zoomHelperText}</div>
                    </Popover>
                </div>
            </div>
        )
    }
}
