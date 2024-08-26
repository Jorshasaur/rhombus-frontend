import { DragSourceMonitor } from 'react-dnd'
import { Blot, Parent } from 'parchment/dist/src/blot/abstract/blot'
import PubSub from 'pubsub-js'
import Quill from 'quill/core'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../constants/topics'
import { beginDragging, endDragging } from '../../../../data/actions'
import store from '../../../../data/store'
import QuillSources from '../../../quill/modules/QuillSources'
import quillProvider from '../../../quill/provider'
import { DragItem, DRAG_ITEM_TYPE, NestedItem } from './DragItem'
import {
    attachDragEvent,
    dropAnalytics,
    getDraggingItem,
    getDraggingNodesHeight,
    getNextSibling,
    isDragOverInDraggingNodes,
    LineDragProps,
    removeEmptyLists,
    resetNextSiblingMargin,
    resetOpacity,
    resetTodoListOpacity,
    setKeepAuthor,
    setSelectionAfterDrag
} from './LineDragUtils'

const Parchment = Quill.import('parchment')

export function beginDrag(props: LineDragProps): DragItem {
    // disable quill so we prevent editor cursor from showing
    const quill = quillProvider.getQuill()
    quill.root.classList.add('hide-cursor')

    // remove selection before dragging
    quill.setSelection(null, QuillSources.USER)

    // set dragging to redux
    store.dispatch(beginDragging())

    // get dragging item
    const draggingItem = getDraggingItem(quill, props.index)

    // attach drag event
    const dragEventData = attachDragEvent(quill, props.navigationHeight)

    return {
        dragOver: dragEventData.dragOver,
        firstDraggingNode: draggingItem.firstDraggingNode,
        draggingNodes: draggingItem.draggingNodes,
        dragEventHandler: dragEventData.handler,
        dragHandle: props.dragHandle,
        type: draggingItem.type
    }
}

export function endDrag(_props: LineDragProps, monitor: DragSourceMonitor) {
    const quill = quillProvider.getQuill()
    quill.root.classList.remove('hide-cursor')
    const scrollTop = quill.scrollingContainer.scrollTop
    const item: DragItem = monitor.getItem()
    item.dragOver.end = true
    const dragOverElement = item.dragOver.element
    let draggingNodes = item.draggingNodes

    store.dispatch(endDragging())

    document.removeEventListener('dragover', item.dragEventHandler, true)

    if (item.type === DRAG_ITEM_TYPE.TODO_LIST) {
        resetTodoListOpacity(draggingNodes as NestedItem[])
    } else {
        ;(draggingNodes as HTMLElement[]).forEach(resetOpacity)
    }

    if (dragOverElement != null) {
        dragOverElement.classList.remove('dragover')
        quill.setSelection(null)

        const { firstDraggingNode } = item
        if (
            isDragOverInDraggingNodes(dragOverElement, item) ||
            firstDraggingNode === dragOverElement.nextSibling
        ) {
            dropAnalytics(item, false)
            quill.focus()
            return
        }
        dropAnalytics(item, true)

        const differenceFromInitialOffset = monitor.getDifferenceFromInitialOffset()

        // If dragging an item from above, add the height of the dragging item to the top margin of the next sibling
        // so that we can transition the "jump" of the dragged items removal
        if (differenceFromInitialOffset && differenceFromInitialOffset.y > -1) {
            const itemHeight = getDraggingNodesHeight(item)
            const nextSibling = getNextSibling(item.type, draggingNodes)

            if (nextSibling) {
                nextSibling.dataset.previousMarginTop =
                    window.getComputedStyle(nextSibling).marginTop || '0'
                nextSibling.classList.add('next-sibling')
                nextSibling.style.marginTop = `${itemHeight}px`
            }
        }

        let newNodes: HTMLElement[] = []
        const parentNodes: HTMLElement[] = []

        if (item.type === DRAG_ITEM_TYPE.LIST) {
            parentNodes.push(firstDraggingNode.parentElement!)
            const parent = firstDraggingNode.parentElement!.cloneNode() as HTMLElement

            draggingNodes = draggingNodes as HTMLElement[]
            draggingNodes.forEach((draggingNode) => {
                parent.appendChild(draggingNode)
            })

            newNodes = [parent]
        } else if (item.type === DRAG_ITEM_TYPE.TODO_LIST) {
            const nestedItems = draggingNodes as NestedItem[]
            newNodes = []
            nestedItems.forEach((nestedItem) => {
                const parent = nestedItem.element
                parentNodes.push(nestedItem.items[0].parentElement!)
                nestedItem.items.forEach((draggingNode) => {
                    parent.appendChild(draggingNode)
                })
                newNodes.push(parent)
            })
            newNodes.reverse()
        } else {
            if (dragOverElement instanceof HTMLLIElement) {
                // insert non-list items into list item
                if (item.type === DRAG_ITEM_TYPE.LINE) {
                    // if its text line insert content as list item
                    const newNode = dragOverElement.cloneNode() as HTMLElement
                    while (firstDraggingNode.firstChild) {
                        newNode.appendChild(firstDraggingNode.firstChild)
                    }
                    newNodes = [newNode]
                    parentNodes.push(firstDraggingNode)
                } else {
                    // if its embed then split list and insert embed in between
                    const listBlot: Parent = Parchment.find(
                        dragOverElement.parentNode
                    )
                    const listItemBlot: Blot | null = Parchment.find(
                        dragOverElement.nextSibling
                    )
                    const draggingNodeBlot = Parchment.find(firstDraggingNode)
                    // if dragging into the last item in a list, listItemBlot will be null
                    if (listItemBlot == null) {
                        draggingNodeBlot.insertInto(listBlot)
                    } else {
                        listBlot.insertBefore(draggingNodeBlot, listItemBlot)
                    }
                }
            } else {
                newNodes = [firstDraggingNode]
            }
        }

        setKeepAuthor(dragOverElement)

        // Animate the dragged item sibling's margin top back to it's original value
        resetNextSiblingMargin(differenceFromInitialOffset)

        if (
            (item.type === DRAG_ITEM_TYPE.LIST ||
                item.type === DRAG_ITEM_TYPE.TODO_LIST) &&
            dragOverElement.parentNode!.nextSibling == null &&
            dragOverElement.nextSibling == null
        ) {
            newNodes.forEach((newNode) => {
                setKeepAuthor(newNode)
                dragOverElement.parentNode!.parentNode!.appendChild(newNode)
            })
        } else {
            newNodes.forEach((newNode) => {
                setKeepAuthor(newNode)
                dragOverElement.parentNode!.insertBefore(
                    newNode,
                    dragOverElement.nextSibling
                )
            })
        }
        removeEmptyLists(parentNodes, () => {
            PubSub.publish(DOCUMENT_CHANGE_REPOSITION, null)
            setSelectionAfterDrag(item, quill)

            // Don't jump that scroll
            quill.scrollingContainer.scrollTop = scrollTop
        })
    }
}
