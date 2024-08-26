import { noop } from 'lodash'
import quill from 'quill/core'
import List, { ListItem } from 'quill/formats/list'
import {
    DragItem,
    DRAG_ITEM_TYPE
} from '../../../../../components/pages/Editor/LineDrag/DragItem'
import { endDrag } from '../../../../../components/pages/Editor/LineDrag/LineDragHandlers'
import quillProvider from '../../../../../components/quill/provider'
import { createMockBlockEmbed } from '../../../../mockData/mockBlockEmbed'
import { mockQuill } from '../../../../mockData/mockQuill'
const Parchment = quill.import('parchment')
quillProvider.setQuill(mockQuill)

jest.mock('../../../../../data/store', () => {
    return {
        dispatch: require('lodash').noop
    }
})

jest.mock('../../../../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

const props = {
    index: 1,
    navigationHeight: 100,
    dragHandle: true
}

const listBlot = new List(List.create('unordered'))
const dragOver = new ListItem(ListItem.create())
Object.assign(dragOver, {
    element: dragOver.domNode,
    end: false,
    nextSibling: null
})
listBlot.domNode.__defineGetter__('children', () => dragOver)
dragOver.element.__defineGetter__('parentNode', () => listBlot.domNode)

const firstDraggingNode = document.createElement('div')
const draggingNodeBlot = createMockBlockEmbed()

Parchment.find = (el: HTMLElement) => {
    if (el === firstDraggingNode) {
        return draggingNodeBlot
    } else if (el === listBlot.domNode) {
        return listBlot
    } else if (el == null) {
        return null
    }

    return createMockBlockEmbed()
}

const item: DragItem = {
    dragOver,
    draggingNodes: [document.createElement('div')],
    dragEventHandler: noop,
    type: DRAG_ITEM_TYPE.EMBED,
    firstDraggingNode
}

const monitor: any = {
    getItem: () => item,
    getDifferenceFromInitialOffset: () => ({ x: 0, y: 1 })
}

describe('LineDragSource', () => {
    describe('dragging embeds into lists', () => {
        it('inserts the embed after the list if dragged onto the last list item', () => {
            // @ts-ignore
            jest.spyOn(draggingNodeBlot, 'insertInto')
            endDrag(props, monitor)
            // @ts-ignore
            expect(draggingNodeBlot.insertInto).toHaveBeenCalled()
        })
    })
})
