import cx from 'classnames'
import { debounce, includes } from 'lodash'
import PubSub from 'pubsub-js'
import * as React from 'react'
import {
    PANE_EMBED_BLOT_NAME,
    RESIZEABLE_SERVICES
} from '../../../../constants/embeds'
import { GUTTER_WIDTH, RESIZE_EVENT_WAIT } from '../../../../constants/styles'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../constants/topics'
import { MouseOverBlotData } from '../../../../data/reducers/mouseover'
import { getLargeEmbedLeft } from '../../../../helpers/EmbedHelper'
import { BlotSize } from '../../../../interfaces/blotSize'
import { SelectionType } from '../../../../interfaces/selectionType'
import {
    CommentMarking,
    GlobalCommentMarkingModule
} from '../../../quill/modules/CommentMarking'
import quillProvider from '../../../quill/provider'
import getEmbedFromIndex from '../../../quill/utils/getEmbedFromIndex'
import DragButton from '../LineDrag/DragButton'
import DragPreviewLayer from '../LineDrag/DragPreviewLayer'
import PlusButton from '../PlusMenu/PlusButton'
import { CommentControl } from './CommentControl'
import styles from './LineControls.module.css'
import { ResizeControl } from './ResizeControl'

const BUTTON_HEIGHT = 12
const PARAGRAPH_OFFSET = 6
const CODE_OFFSET = 7
const H1_OFFSET = 23
const H2_OFFSET = 11
const H3_OFFSET = 5
const DIVIDER_OFFSET = -2
const IMAGE_OFFSET = 0
const EMBED_OFFSET = 13
const LINE_CONTROLS_LEFT_OFFSET = 37

export interface Props {
    activeEmbed: string | null
    id: string
    index: number
    blotType: SelectionType
    blotName: string
    blotData: MouseOverBlotData
    top: number
    height: number
    navigationHeight: number
    dragging: boolean
    onUploadFiles: (files: File[]) => void
    onPlusClicked: (top: number) => void
    canEdit: boolean
    canComment: boolean
    containerWidth: number
}

interface State {
    top: number
    resizing: boolean
    hide: boolean
}

export default class LineControls extends React.Component<Props, State> {
    // Hide line controls when resize begins
    hideControls = debounce(
        () => {
            this.setState({ hide: true })
        },
        RESIZE_EVENT_WAIT,
        {
            leading: true,
            trailing: false
        }
    )

    // Show line controls when resize ends
    showControls = debounce(
        () => {
            const top = this.calculateTop(this.props)
            this.setState({ top, hide: false })
        },
        RESIZE_EVENT_WAIT,
        {
            leading: false,
            trailing: true
        }
    )

    constructor(props: Props) {
        super(props)
        const top = this.calculateTop(props)
        this.state = { top, resizing: false, hide: false }
    }

    calculateTop(props: Props) {
        if (props.blotType === SelectionType.Text) {
            if (props.blotName === 'header1') {
                return props.top + H1_OFFSET
            } else if (props.blotName === 'header2') {
                return props.top + H2_OFFSET
            } else if (props.blotName === 'header3') {
                return props.top + H3_OFFSET
            } else if (
                props.blotName === 'block' ||
                props.blotName === 'list-item' ||
                props.blotName === 'blockquote'
            ) {
                return props.top + PARAGRAPH_OFFSET
            } else if (props.blotName === 'code-block') {
                return props.top + CODE_OFFSET
            } else if (props.blotName === 'divider') {
                return (
                    props.top +
                    (props.height - BUTTON_HEIGHT) / 2 +
                    DIVIDER_OFFSET
                )
            }
        } else if (props.blotType === SelectionType.Embed) {
            if (props.blotName === 'image') {
                return props.top + IMAGE_OFFSET
            }
            return props.top + EMBED_OFFSET
        }

        return props.top + (props.height - BUTTON_HEIGHT) / 2
    }
    private _isChangingSize = (nextProps: Props) => {
        return (
            this.props.index === nextProps.index &&
            this.props.blotData &&
            this.props.blotData.size &&
            nextProps.blotData &&
            nextProps.blotData.size &&
            this.props.blotData.size !== nextProps.blotData.size
        )
    }
    componentDidMount() {
        window.addEventListener('resize', this.hideControls)
        window.addEventListener('resize', this.showControls)
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.hideControls)
        window.removeEventListener('resize', this.showControls)
    }
    componentWillReceiveProps(nextProps: Props) {
        if (this.props.index !== nextProps.index) {
            const top = this.calculateTop(nextProps)
            this.setState({ top, resizing: false })
        }
        // Only transition the position of line controls if the blot is resizing.
        if (this._isChangingSize(nextProps)) {
            this.setState({ resizing: true })
        }
    }

    _isResizable = () => {
        const blot = getEmbedFromIndex(this.props.index)

        return (
            includes(RESIZEABLE_SERVICES, this.props.blotName) &&
            !!(blot && blot.viewable())
        )
    }

    _hasOptions = () => this.props.blotType === SelectionType.Embed

    _onPlusClicked = () => {
        this.props.onPlusClicked(this.props.top)
    }

    render() {
        const {
            index,
            dragging,
            blotData,
            canEdit,
            canComment,
            blotType,
            blotName,
            id,
            activeEmbed
        } = this.props

        // ! Temporarily disable commenting on embeds in comment only mode for https://invisionapp.atlassian.net/browse/SLATE-1401
        // TODO: Remove this when fixed on the server
        const allowCommentingOnLine = !(
            blotType === SelectionType.Embed && !canEdit
        )

        if (!index) {
            return null
        }

        const size = blotData && blotData.size

        let top = this.state.top
        let left = null

        if (size === BlotSize.Large) {
            left =
                getLargeEmbedLeft(this.props.containerWidth, GUTTER_WIDTH * 2) -
                LINE_CONTROLS_LEFT_OFFSET
        }

        if (blotName === PANE_EMBED_BLOT_NAME) {
            top += 14
            const portal = document.getElementById(`portal-${id}`)
            if (id === activeEmbed || portal?.classList.contains('selected')) {
                return null
            }
        }

        const style: React.CSSProperties = {
            top: `${top}px`,
            left: left ? `${left}px` : undefined
        }

        return (
            <div
                style={style}
                className={cx(styles.lineControls, {
                    [styles.resizing]: this.state.resizing,
                    [styles.hide]: this.state.hide
                })}>
                {canEdit && (
                    <PlusButton
                        dragging={dragging}
                        onClick={this._onPlusClicked}
                    />
                )}
                {canEdit && (
                    <DragButton
                        index={index}
                        navigationHeight={this.props.navigationHeight}
                        dragHandle={true}
                        dragging={dragging}
                    />
                )}

                {this._hasOptions() && (
                    <div
                        className={cx(styles.resizeContainer, {
                            [styles.commentOnly]: !canEdit && canComment
                        })}>
                        {canEdit && this._isResizable() && !dragging && (
                            <React.Fragment>
                                {blotName !== 'video' && (
                                    <ResizeControl
                                        size={BlotSize.Small}
                                        onClick={this._handleResizeClick}
                                        isActive={size === BlotSize.Small}
                                    />
                                )}
                                <ResizeControl
                                    size={BlotSize.Medium}
                                    onClick={this._handleResizeClick}
                                    isActive={size === BlotSize.Medium}
                                />
                                <ResizeControl
                                    size={BlotSize.Large}
                                    onClick={this._handleResizeClick}
                                    isActive={size === BlotSize.Large}
                                />
                            </React.Fragment>
                        )}
                        {(canEdit || canComment) &&
                            !dragging &&
                            allowCommentingOnLine && (
                                <CommentControl
                                    onClick={this._handleCommentClick}
                                />
                            )}
                    </div>
                )}

                {canEdit && <DragPreviewLayer index={this.props.index} />}
            </div>
        )
    }

    _handleResizeClick = (size: BlotSize) => {
        const blot = getEmbedFromIndex(this.props.index)

        if (blot != null) {
            blot.setSize(size)
            PubSub.publish(DOCUMENT_CHANGE_REPOSITION, null)
        }
    }

    _handleCommentClick = () => {
        const commentMarking = quillProvider
            .getQuill()
            .getModule(CommentMarking.moduleName)
        const id = commentMarking.create(
            this.props.index,
            length,
            SelectionType.Embed
        )
        setImmediate(() => {
            GlobalCommentMarkingModule.select(id)
        })
    }
}
