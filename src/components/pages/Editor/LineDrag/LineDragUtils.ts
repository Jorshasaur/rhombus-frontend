import { XYCoord } from 'dnd-core'
import { throttle } from 'lodash'
import Quill from 'quill/core'
import DragDropAnalytics from '../../../../analytics/AnalyticsBuilders/DragDropAnalytics'
import { PANE_SERVICE_NAME } from '../../../../constants/embeds'
import { IS_END_TO_END_TEST } from '../../../../constants/general'
import {
    DND_ANIMATION_SPEED,
    SLOW_ANIMATION_FACTOR
} from '../../../../constants/styles'
import { Embed } from '../../../../interfaces/Embed'
import { flattenLines } from '../../../../lib/utils'
import QuillSources from '../../../quill/modules/QuillSources'
import { DragItem, DRAG_ITEM_TYPE, NestedItem } from './DragItem'

const Parchment = Quill.import('parchment')

export interface LineDragProps {
    index: number
    navigationHeight: number
    dragHandle?: boolean
}

interface DragOver {
    element: HTMLElement | null
    end: boolean
}

export interface DragEventData {
    handler: (event: DragEvent) => void
    dragOver: DragOver
}

function setOpacity(element: HTMLElement) {
    element.classList.add('dragging')
    let fadeElement = element
    if (element.dataset.service === PANE_SERVICE_NAME) {
        fadeElement =
            document.getElementById(`portal-${element.dataset.uuid}`) ||
            fadeElement
    }
    fadeElement.style.opacity = '0.2'
}

export function resetOpacity(element: HTMLElement) {
    element.classList.remove('dragging')
    let fadeElement = element
    if (element.dataset.service === PANE_SERVICE_NAME) {
        fadeElement =
            document.getElementById(`portal-${element.dataset.uuid}`) ||
            fadeElement
    }
    fadeElement.style.opacity = ''
}

function getListItemIndent(listItem: HTMLLIElement) {
    const className = listItem.className
    if (className) {
        return parseInt(className.replace('ql-indent-', ''), 10)
    }
    return 0
}

function getNestedListItems(draggingNode: HTMLLIElement) {
    const dragNodeIndent = getListItemIndent(draggingNode)
    let nextSibling = draggingNode.nextElementSibling as HTMLLIElement | null
    const listItems = [draggingNode]

    while (
        nextSibling != null &&
        getListItemIndent(nextSibling) > dragNodeIndent
    ) {
        listItems.push(nextSibling)
        nextSibling = nextSibling.nextElementSibling as HTMLLIElement | null
    }

    return listItems
}

function listIsTodoList(list: HTMLElement) {
    return list.hasAttribute('data-checked')
}

function listItemIsTodoList(listItem: HTMLLIElement) {
    return listItem.parentElement!.hasAttribute('data-checked')
}

function getTodoListItemNextElementSibling(
    listItem: HTMLLIElement
): [HTMLLIElement | null, boolean] {
    let nextSibling = listItem.nextElementSibling as HTMLLIElement | null
    if (
        nextSibling == null &&
        listItem.parentElement != null &&
        listItem.parentElement.nextElementSibling != null &&
        listIsTodoList(listItem.parentElement.nextElementSibling as HTMLElement)
    ) {
        nextSibling = listItem.parentElement.nextElementSibling
            .firstElementChild as HTMLLIElement | null
        return [nextSibling, true]
    }
    return [nextSibling, false]
}

function getClonedListFromListItem(listItem: HTMLLIElement) {
    return listItem.parentElement!.cloneNode() as HTMLUListElement
}

function getNestedTodoListItems(draggingNode: HTMLLIElement) {
    const dragNodeIndent = getListItemIndent(draggingNode)
    const lists = []
    let list = {
        element: getClonedListFromListItem(draggingNode),
        items: [draggingNode]
    }
    lists.push(list)

    let [nextSibling, newList] = getTodoListItemNextElementSibling(draggingNode)

    while (
        nextSibling != null &&
        getListItemIndent(nextSibling) > dragNodeIndent
    ) {
        if (newList) {
            list = {
                element: getClonedListFromListItem(nextSibling),
                items: []
            }
            lists.push(list)
        }
        list.items.push(nextSibling)

        const nextSiblingRes = getTodoListItemNextElementSibling(nextSibling)
        nextSibling = nextSiblingRes[0]
        newList = nextSiblingRes[1]
    }

    return lists
}

function setTodoListOpacity(todoList: NestedItem[]) {
    todoList.forEach((nestedItem) => {
        nestedItem.items.forEach(setOpacity)
    })
}

export function resetTodoListOpacity(todoList: NestedItem[]) {
    todoList.forEach((nestedItem) => {
        nestedItem.items.forEach(resetOpacity)
    })
}

export function isDragOverInDraggingNodes(
    dragOver: HTMLElement,
    item: DragItem
) {
    if (item.type === DRAG_ITEM_TYPE.LIST) {
        const draggingNodes = item.draggingNodes as HTMLElement[]
        return draggingNodes.indexOf(dragOver) !== -1
    } else if (item.type === DRAG_ITEM_TYPE.TODO_LIST) {
        const nestedItems = item.draggingNodes as NestedItem[]
        let ret = false
        nestedItems.forEach((nestedItem) => {
            if (nestedItem.items.indexOf(dragOver) !== -1) {
                ret = true
                return false
            }
            return true
        })
        return ret
    } else {
        return dragOver === item.firstDraggingNode
    }
}

function removeParent(parentToRemove: HTMLElement) {
    parentToRemove.remove()
}

export function removeEmptyLists(
    parentNodes: HTMLElement[],
    callback: () => void
) {
    const parentsToRemove = parentNodes.reduce(
        (res: HTMLElement[], parentNode) => {
            if (parentNode.children.length === 0) {
                res.push(parentNode)
            }
            return res
        },
        []
    )

    setImmediate(() => {
        parentsToRemove.forEach(removeParent)
        callback()
    })
}

export function setKeepAuthor(node: HTMLElement) {
    Array.from(node.querySelectorAll('[data-author-id]')).forEach(
        (authorNode) => {
            authorNode.classList.add('keep-author-true')
        }
    )
}

export function setSelectionAfterDrag(item: DragItem, quill: Quill) {
    // Select Blot, or set selection to beginning of dropped content
    const droppedBlot = Parchment.find(item.firstDraggingNode) as Embed | null
    const droppedBlotIndex = quill.getIndex(droppedBlot)
    if (droppedBlot?.isEmbed) {
        droppedBlot.select(droppedBlotIndex)
    }
    quill.setSelection(droppedBlotIndex, 0, QuillSources.USER)
}

export function getDraggingItem(quill: Quill, index: number) {
    const [dragLine] = quill.getLine(index)
    const draggingNode = dragLine.domNode as HTMLElement
    let draggingNodes
    let dragItemType

    if (draggingNode instanceof HTMLLIElement) {
        if (listItemIsTodoList(draggingNode)) {
            draggingNodes = getNestedTodoListItems(draggingNode)
            setTodoListOpacity(draggingNodes)
            dragItemType = DRAG_ITEM_TYPE.TODO_LIST
        } else {
            draggingNodes = getNestedListItems(draggingNode)
            draggingNodes.forEach(setOpacity)
            dragItemType = DRAG_ITEM_TYPE.LIST
        }
    } else {
        setOpacity(draggingNode)
        draggingNodes = [draggingNode]

        if (draggingNode instanceof HTMLDivElement) {
            dragItemType = DRAG_ITEM_TYPE.EMBED
        } else if (draggingNode instanceof HTMLHRElement) {
            dragItemType = DRAG_ITEM_TYPE.DIVIDER
        } else if (draggingNode instanceof HTMLPreElement) {
            dragItemType = DRAG_ITEM_TYPE.CODE_BLOCK
        } else {
            dragItemType = DRAG_ITEM_TYPE.LINE
        }
    }

    return {
        firstDraggingNode: draggingNode,
        draggingNodes,
        type: dragItemType
    }
}

export function attachDragEvent(
    quill: Quill,
    navigationHeight: number,
    stopPropagation: boolean = false
): DragEventData {
    const { scrollingContainer } = quill
    const children = flattenLines(Array.from(quill.root.children))

    const dragOver = {
        element: null as HTMLElement | null,
        end: false
    }

    const dragEventHandler = (event: DragEvent) => {
        if (dragOver.end || !event.clientY) {
            return
        }

        let currentDragoverElement: HTMLElement | undefined

        children.forEach((child: HTMLElement) => {
            const offsetTop =
                child.offsetTop -
                scrollingContainer.scrollTop +
                navigationHeight
            const offsetBottom = child.clientHeight + offsetTop
            if (event.clientY > offsetTop && event.clientY < offsetBottom) {
                currentDragoverElement = child
                return false
            }
            return true
        })

        if (currentDragoverElement != null) {
            if (currentDragoverElement !== dragOver.element) {
                if (dragOver.element != null) {
                    dragOver.element.classList.remove('dragover')
                }

                currentDragoverElement.classList.add('dragover')
                dragOver.element = currentDragoverElement
            }
        }
    }

    const dragEventHandlerThrottled = throttle(dragEventHandler, 20)

    const dragEventHandlerWrapper = (event: DragEvent) => {
        if (stopPropagation) {
            event.stopPropagation()
            event.preventDefault()
        }
        dragEventHandlerThrottled(event)
    }

    document.addEventListener('dragover', dragEventHandlerWrapper, true)

    return {
        dragOver,
        handler: dragEventHandlerWrapper
    }
}

export function getDraggingNodesHeight(item: DragItem): number {
    let height = 0
    if (item.type === DRAG_ITEM_TYPE.TODO_LIST) {
        ;(item.draggingNodes as NestedItem[]).forEach((nestedItem) => {
            nestedItem.items.forEach((nestedItemItem) => {
                height += nestedItemItem.clientHeight
            })
        })
    } else {
        ;(item.draggingNodes as HTMLElement[]).forEach((draggedNode) => {
            height += draggedNode.clientHeight
        })
    }
    return height
}

export function getNextSibling(
    type: DRAG_ITEM_TYPE,
    draggingNodes: HTMLElement[] | NestedItem[]
): HTMLElement | null {
    if (type === DRAG_ITEM_TYPE.LIST) {
        const nodes = draggingNodes as HTMLElement[]
        const lastItem = nodes[nodes.length - 1]
        return lastItem.parentElement!.nextElementSibling as HTMLElement | null
    } else if (type === DRAG_ITEM_TYPE.TODO_LIST) {
        const nodes = draggingNodes as NestedItem[]
        const lastNestedItem = nodes[nodes.length - 1]
        const lastItem = lastNestedItem.items[lastNestedItem.items.length - 1]
        return lastItem.parentElement!.nextElementSibling as HTMLElement | null
    } else {
        const nodes = draggingNodes as HTMLElement[]
        const lastItem = nodes[nodes.length - 1]
        return lastItem.nextElementSibling as HTMLElement | null
    }
}

export function resetNextSiblingMargin(
    differenceFromInitialOffset: XYCoord | null
) {
    const animationSpeed =
        IS_END_TO_END_TEST && window.slowAnimations
            ? DND_ANIMATION_SPEED * SLOW_ANIMATION_FACTOR
            : DND_ANIMATION_SPEED
    if (differenceFromInitialOffset && differenceFromInitialOffset.y > -1) {
        // Get the transitioned items
        const nextSiblingArray = Array.from(
            document.getElementsByClassName('next-sibling')
        )
        nextSiblingArray.forEach((sibling: HTMLElement) => {
            // Reset them
            sibling.style.transition = `all ease .15s`
            sibling.style.marginTop = sibling.dataset.previousMarginTop || '0'
            setTimeout(() => {
                // Remove unneeded attributes after animation has completed
                sibling.classList.remove('next-sibling')
                sibling.style.marginTop = ''
                sibling.style.transition = 'unset'
                sibling.removeAttribute('data-previous-margin-top')
            }, animationSpeed)
        })
    }
}

function matchBlockEmbed(node: Node) {
    const match = Parchment.query(node)
    if (match == null) {
        return
    }

    const { name } = match

    if (name === 'BlockEmbed' || name === 'PaneEmbed') {
        return match.value(node)
    }

    return
}

export function dropAnalytics(item: DragItem, dragComplete: boolean) {
    const analytics = new DragDropAnalytics()
    let itemType = ''
    if (item.type === DRAG_ITEM_TYPE.LINE) {
        itemType = 'text'
    } else if (
        item.type === DRAG_ITEM_TYPE.LIST ||
        item.type === DRAG_ITEM_TYPE.TODO_LIST
    ) {
        itemType = 'list'
    } else if (item.type === DRAG_ITEM_TYPE.EMBED) {
        const match = matchBlockEmbed(item.firstDraggingNode)

        if (match) {
            itemType = match.service
        }
    }
    analytics.itemType(itemType)

    if (dragComplete) {
        analytics.isComplete()
    } else {
        analytics.isIncomplete()
    }

    analytics.track()
}
