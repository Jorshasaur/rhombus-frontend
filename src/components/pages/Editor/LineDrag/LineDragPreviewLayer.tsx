import cx from 'classnames'
import React from 'react'
import { XYCoord } from 'react-dnd'
import IconDrag from '../../../../assets/images/icons/icon-drag.svg'
import {
    BLOCK_EMBED_BLOT_NAME,
    PANE_EMBED_BLOT_NAME,
    PANE_SERVICE_NAME
} from '../../../../constants/embeds'
import { BlockEmbed } from '../../../quill/blots/BlockEmbed'
import Quill from '../../../quill/entries/Editor'
import blotStyles from '../Blots/Blots.module.css'
import ImageEmbedContainer from '../Blots/ImageEmbedContainer'
import { DragItem, DRAG_ITEM_TYPE, NestedItem } from './DragItem'
import styles from './LineDragPreviewLayer.module.css'

const Parchment = Quill.import('parchment')

interface Props {
    item: DragItem
    clientOffset?: XYCoord
}

export enum PREVIEW_TYPE {
    LINE,
    IMAGE,
    PANE
}

const LINE_HEIGHT = 28
const H1_LINE_HEIGHT = 48
const H2_LINE_HEIGHT = 32
const CODE_BLOCK_HEIGHT = 38
const MAX_LIST_ITEMS = 4

interface State {
    previewType: PREVIEW_TYPE
    imageUrl?: string
}

function cloneNode(node: HTMLElement) {
    const clonedNode = node.cloneNode(true) as HTMLElement
    clonedNode.style.opacity = null
    return clonedNode
}

function getTodoListLength(nestedItems: NestedItem[]) {
    return nestedItems.reduce((len: number, nestedItem: NestedItem): number => {
        return (len += nestedItem.items.length)
    }, 0)
}

export default class LineDragPreviewLayer extends React.Component<
    Props,
    State
> {
    _lineRef: HTMLDivElement | null
    _componentRef: HTMLDivElement | null
    _clonedNode: HTMLElement

    constructor(props: Props) {
        super(props)

        const { draggingNodes, firstDraggingNode, type } = this.props.item
        let previewType = PREVIEW_TYPE.LINE
        let imageUrl

        if (type === DRAG_ITEM_TYPE.LIST) {
            const parentClonedNode = firstDraggingNode.parentElement!.cloneNode() as HTMLElement
            ;(draggingNodes as HTMLElement[]).forEach((draggingNode) => {
                parentClonedNode.appendChild(cloneNode(draggingNode))
            })

            this._clonedNode = parentClonedNode
        } else if (type === DRAG_ITEM_TYPE.TODO_LIST) {
            const parentNode = document.createElement('div')
            const nestedItems = draggingNodes as NestedItem[]
            nestedItems.forEach((nestedItem) => {
                const nestedParentNode = nestedItem.element.cloneNode() as HTMLElement
                nestedItem.items.forEach((draggingNode) => {
                    nestedParentNode.appendChild(cloneNode(draggingNode))
                })
                parentNode.appendChild(nestedParentNode)
            })
            this._clonedNode = parentNode
        } else if (type === DRAG_ITEM_TYPE.EMBED) {
            const embed: BlockEmbed = Parchment.find(firstDraggingNode)
            const data =
                embed.value(embed.domNode)[BLOCK_EMBED_BLOT_NAME] ||
                embed.value(embed.domNode)[PANE_EMBED_BLOT_NAME]

            if (data.service === 'image') {
                const provider = (embed.provider as any) as ImageEmbedContainer
                if (provider != null) {
                    imageUrl = provider.getImageUrl()
                }

                previewType = PREVIEW_TYPE.IMAGE
            } else if (data.service === PANE_SERVICE_NAME) {
                const el = window.document.createElement('div')
                document.body.appendChild(el)

                this._clonedNode = cloneNode(
                    document.getElementById(`pane-${data.uuid}`) || el
                )

                previewType = PREVIEW_TYPE.PANE
            } else {
                const el = window.document.createElement('div')
                document.body.appendChild(el)

                this._clonedNode = cloneNode(
                    firstDraggingNode.querySelector('[data-persistent-bar]') ||
                        el
                )

                const actionArea = this._clonedNode.querySelector<
                    HTMLDivElement
                >(
                    `.${blotStyles.actionArea}, .${blotStyles.persistentTimestamp}`
                )

                if (actionArea != null) {
                    actionArea.style.visibility = 'hidden'
                }
            }
        } else {
            this._clonedNode = cloneNode(firstDraggingNode)
        }

        this.state = {
            previewType,
            imageUrl
        }
    }

    componentDidMount() {
        if (this._lineRef == null) {
            return
        }

        if (this._clonedNode != null) {
            this._lineRef.appendChild(this._clonedNode)
        }
    }

    _setLineRef = (ref: HTMLDivElement | null) => {
        this._lineRef = ref
    }

    _setComponentRef = (ref: HTMLDivElement | null) => {
        this._componentRef = ref
    }

    _getItemStyles() {
        const { clientOffset } = this.props
        if (!clientOffset) {
            return {
                display: 'none'
            }
        }

        let height = 0
        if (this._componentRef != null) {
            height = this._componentRef.clientHeight
        }

        const { x, y } = clientOffset
        const transform = `translate(${x}px, ${y - height}px)`

        return {
            transform: transform,
            WebkitTransform: transform
        }
    }

    _renderImagePreview() {
        return (
            <React.Fragment>
                {this.props.item.dragHandle && <IconDrag />}
                <div className={styles.image}>
                    <img src={this.state.imageUrl!} />
                </div>
            </React.Fragment>
        )
    }

    _renderLinePreview() {
        let multiline = false
        let tagClass

        if (this._clonedNode != null) {
            const { tagName, clientHeight } = this._clonedNode
            const { type, draggingNodes } = this.props.item
            const { previewType } = this.state

            if (tagName === 'H1') {
                tagClass = styles.h1
                multiline = clientHeight !== H1_LINE_HEIGHT
            } else if (tagName === 'H2') {
                tagClass = styles.h2
                multiline = clientHeight !== H2_LINE_HEIGHT
            } else if (tagName === 'PRE') {
                tagClass = styles.pre
                multiline = clientHeight !== CODE_BLOCK_HEIGHT
            } else if (type === DRAG_ITEM_TYPE.LIST) {
                multiline = this._clonedNode.children.length > MAX_LIST_ITEMS
                tagClass = styles.list
            } else if (type === DRAG_ITEM_TYPE.TODO_LIST) {
                const len = getTodoListLength(draggingNodes as NestedItem[])
                multiline = len > MAX_LIST_ITEMS
                tagClass = styles.list
            } else if (
                previewType === PREVIEW_TYPE.PANE &&
                type === DRAG_ITEM_TYPE.EMBED
            ) {
                tagClass = styles.paneEmbed
            } else if (type === DRAG_ITEM_TYPE.EMBED) {
                tagClass = styles.blockEmbed
            } else {
                multiline = clientHeight !== LINE_HEIGHT
            }
        }

        return (
            <React.Fragment>
                <IconDrag />
                <div
                    className={cx(styles.line, tagClass, {
                        [styles.multiline]: multiline
                    })}
                    ref={this._setLineRef}
                />
            </React.Fragment>
        )
    }

    render() {
        let component
        if (this.state.previewType === PREVIEW_TYPE.IMAGE) {
            component = this._renderImagePreview()
        } else {
            component = this._renderLinePreview()
        }

        return (
            <div
                className={cx('line-drag-layer', styles.lineDragLayer)}
                style={this._getItemStyles()}
                ref={this._setComponentRef}>
                {component}
            </div>
        )
    }
}
