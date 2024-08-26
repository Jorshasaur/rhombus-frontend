import cuid from 'cuid'
import json1 from 'ot-json1'
import Delta, { DeltaStatic } from 'quill-delta'
import { v4 as uuid } from 'uuid'
import {
    ColumnSizeUpdate,
    Pane,
    PaneElement,
    PaneElementType,
    PaneImage,
    PaneList,
    PaneText,
    PaneViewType
} from './Advil'
import {
    getElementIndex,
    getElementValueAtPath,
    getListSelection,
    getValueAtPath
} from './AdvilSelectors'

export type Op = [json1.JSONOp, json1.JSONOp]

export function createPane(
    id = uuid(),
    elements: PaneList[] | PaneElement[] = [],
    viewType = PaneViewType.TABLE
): Pane {
    return {
        id,
        viewType,
        elements,
        metadata: {}
    }
}

export function createList(
    id = uuid(),
    elements: PaneList[] | PaneElement[] = [],
    metadata: object = {}
): PaneList {
    return { id, elements, metadata }
}

export function createImage(width: number, height: number): PaneImage {
    return {
        type: PaneElementType.IMAGE,
        id: uuid(),
        value: {
            width,
            height,
            id: uuid()
        }
    }
}

export function createText(delta?: DeltaStatic, id = uuid()): PaneText {
    if (!delta) {
        delta = new Delta([{ insert: '\n', attributes: { id: cuid() } }])
    }

    return {
        type: PaneElementType.TEXT,
        id,
        value: delta
    }
}

export function addList(
    pane: Pane,
    elements?: PaneElement[],
    position?: number,
    listId?: string
): Op {
    let index = position
    if (index == null) {
        index = pane.elements.length
    }
    const list = {
        id: listId || uuid(),
        elements: elements || []
    }
    const op = json1.insertOp(['elements', index], list)
    const inverseOp = json1.removeOp(['elements', index])
    return [op, inverseOp]
}

export function removeList(pane: Pane, listId: string): Op {
    const { index } = getListSelection(pane, listId)
    const op = json1.removeOp(['elements', index])
    const inverseOp = json1.insertOp(['elements', index], pane.elements[index])
    return [op, inverseOp]
}

export function moveListByIndex(
    pane: Pane,
    origin: number,
    destination: number
): Op {
    const op = json1.moveOp(['elements', origin], ['elements', destination])
    const inverseOp = json1.moveOp(
        ['elements', destination],
        ['elements', origin]
    )
    return [op, inverseOp]
}

export function moveList(pane: Pane, listId: string, destination: number): Op {
    const { index } = getListSelection(pane, listId)
    const op = json1.moveOp(['elements', index], ['elements', destination])
    const inverseOp = json1.moveOp(
        ['elements', destination],
        ['elements', index]
    )
    return [op, inverseOp]
}

export function addElementToListAtPosition(
    pane: Pane,
    listId: string,
    position: number,
    paneElement: PaneElement
): Op {
    const { index } = getListSelection(pane, listId)
    const op = json1.insertOp(
        ['elements', index, 'elements', position],
        paneElement
    )
    const inverseOp = json1.removeOp(['elements', index, 'elements', position])
    return [op, inverseOp]
}

export function addElementToListsAtPosition(
    pane: Pane,
    listIds: string[],
    position: number,
    paneElementCallback: () => PaneElement
): Op {
    const indexes = listIds.map((listId) => getListSelection(pane, listId))
    const ops: json1.JSONOp[] = []
    const inverts: json1.JSONOp[] = []

    indexes.forEach((listIndex) => {
        const paneElement = paneElementCallback()
        ops.push(
            json1.insertOp(
                ['elements', listIndex.index, 'elements', position],
                paneElement
            )
        )
        inverts.push(
            json1.removeOp(['elements', listIndex.index, 'elements', position])
        )
    })

    return [ops.reduce(json1.type.compose), inverts.reduce(json1.type.compose)]
}

export function addElementToList(
    pane: Pane,
    listId: string,
    paneElement: PaneElement
): Op {
    const { size } = getListSelection(pane, listId)
    return addElementToListAtPosition(pane, listId, size, paneElement)
}

export function removeElementFromList(
    pane: Pane,
    listId: string,
    elementPosition: number
): Op {
    const { index } = getListSelection(pane, listId)
    const path = ['elements', index, 'elements', elementPosition]
    const op = json1.removeOp(path)
    const inverseOp = json1.insertOp(
        path,
        (pane.elements[index] as PaneList).elements[elementPosition]
    )
    return [op, inverseOp]
}

export function removeElementsFromList(
    pane: Pane,
    listIds: string[],
    elementPosition: number
): Op {
    const listSelections = listIds.map((listId) =>
        getListSelection(pane, listId)
    )
    const ops: json1.JSONOp[] = []
    const inverts: json1.JSONOp[] = []
    listSelections.forEach((listSelection) => {
        const path = [
            'elements',
            listSelection.index,
            'elements',
            elementPosition
        ]

        ops.push(json1.removeOp(path))

        inverts.push(
            json1.insertOp(
                path,
                (pane.elements[listSelection.index] as PaneList).elements[
                    elementPosition
                ]
            )
        )
    })

    return [ops.reduce(json1.type.compose), inverts.reduce(json1.type.compose)]
}

export function moveListsElements(
    pane: Pane,
    originPosition: number,
    destinationPosition: number
): Op {
    const elements = pane.elements as PaneElement[]
    const [ops, inverts] = elements.reduce(
        (res: [json1.JSONOp[], json1.JSONOp[]], element, index) => {
            const fromPath = ['elements', index, 'elements', originPosition]
            const toPath = ['elements', index, 'elements', destinationPosition]
            res[0].push(json1.moveOp(fromPath, toPath))
            res[1].push(json1.moveOp(toPath, fromPath))
            return res
        },
        [[], []]
    )

    return [ops.reduce(json1.type.compose), inverts.reduce(json1.type.compose)]
}

export function moveElementThroughLists(
    pane: Pane,
    originListId: string,
    originPosition: number,
    destinationListId: string,
    destinationPosition: number
): Op {
    const originIndex = getListSelection(pane, originListId).index
    const destinationIndex =
        originListId === destinationListId
            ? originIndex
            : getListSelection(pane, destinationListId).index
    const op = json1.moveOp(
        ['elements', originIndex, 'elements', originPosition],
        ['elements', destinationIndex, 'elements', destinationPosition]
    )
    const inverseOp = json1.moveOp(
        ['elements', destinationIndex, 'elements', destinationPosition],
        ['elements', originIndex, 'elements', originPosition]
    )
    return [op, inverseOp]
}

export function replaceElementAt(
    pane: Pane,
    listId: string,
    position: number,
    newElement: PaneElement
): Op {
    const { index } = getListSelection(pane, listId)
    const path = ['elements', index, 'elements', position]
    const op = replace(path, newElement)
    const inverseOp = replace(
        path,
        (pane.elements[index] as PaneList).elements[position]
    )
    return [op, inverseOp]
}

export function replaceElementPropertyAt(
    pane: Pane,
    listId: string,
    position: number,
    propertyPath: json1.Path,
    newValue: any
): Op {
    const { index } = getListSelection(pane, listId)
    const objectPath = ['elements', index, 'elements', position]
    const destination = objectPath.concat(propertyPath)
    const op = replace(destination, newValue)
    const element = getElementValueAtPath(
        (pane.elements[index] as PaneList).elements[position] as PaneElement,
        propertyPath
    )
    const inverseOp = replace(destination, element)
    return [op, inverseOp]
}

function replace(path: json1.Path, value: any) {
    return json1.replaceOp(path, true, value)
}

export function addImage(
    pane: Pane,
    listId: string,
    height: number,
    width: number
): Op {
    const image = createImage(width, height)
    return addElementToList(pane, listId, image)
}

export function addText(
    pane: Pane,
    listId: string,
    initialDelta: DeltaStatic
): Op {
    const text = createText(initialDelta)
    return addElementToList(pane, listId, text)
}

export function editColumnSizes(
    pane: Pane,
    columnUpdates: ColumnSizeUpdate
): Op {
    const ops: json1.JSONOp[] = []
    const inverts: json1.JSONOp[] = []

    columnUpdates.forEach((columnSize) => {
        const index = columnSize[0]
        const value = columnSize[1]
        const path = ['metadata', 'columnSizes', index]
        const existingSize = pane.metadata.columnSizes![index]

        // Add if not in the current metadata object
        if (!existingSize) {
            ops.push(json1.insertOp(path, value))
            inverts.push(json1.removeOp(path, value))
            // Edit if the value is different than what is currently in the metadata object
        } else if (value !== null && existingSize !== value) {
            ops.push(replace(path, value))
            inverts.push(replace(path, pane.metadata.columnSizes![index]))
            // Delete is the value passed in is null
        } else if (value === null) {
            ops.push(json1.removeOp(path))
            inverts.push(
                json1.insertOp(path, pane.metadata.columnSizes![index])
            )
        }
    })
    if (ops.length && inverts.length) {
        return [
            ops.reduce(json1.type.compose),
            inverts.reduce(json1.type.compose)
        ]
    } else {
        return [ops, inverts]
    }
}

export function editText(
    pane: Pane,
    listId: string,
    textId: string,
    delta: DeltaStatic
): Op {
    const { index } = getListSelection(pane, listId)
    const list = pane.elements[index] as PaneList
    const elementIndex = getElementIndex(list, textId)
    const op = json1.editOp(
        ['elements', index, 'elements', elementIndex, 'value'],
        'rich-text',
        delta
    )
    const currentDelta = (list.elements[elementIndex] as PaneText).value

    const inverseOp = json1.editOp(
        ['elements', index, 'elements', elementIndex, 'value'],
        'rich-text',
        delta.invert(new Delta(currentDelta.ops))
    )
    return [op, inverseOp]
}

export function getTextOps(
    descent: json1.JSONOp,
    callback: (path: json1.Path, op: json1.JSONOpComponent) => void,
    path: json1.Path = []
) {
    for (let i = 0; i < descent.length; i++) {
        const d = descent[i]

        if (Array.isArray(d)) {
            getTextOps(d, callback, ([] as json1.Path).concat(path))
        } else if (typeof d === 'object') {
            if (
                d.i !== undefined &&
                typeof d.i === 'object' &&
                d.i.type === 'text'
            ) {
                // insert text
                callback(([] as json1.Path).concat(path), d)
            } else if (d.et !== undefined && d.et === 'rich-text') {
                // edit text
                callback(([] as json1.Path).concat(path), d)
            }
        } else {
            // path
            path.push(d)
        }
    }
}

interface TextEdit {
    id: string
    delta: DeltaStatic
}

export function getTextEdits(pane: Pane, op: json1.JSONOp): TextEdit[] {
    const newIds = new Set<string>()
    const edits: TextEdit[] = []

    getTextOps(op, (path, op) => {
        if (op.i) {
            // insert
            const text = op.i as PaneText
            newIds.add(text.id)
        } else if (op.et) {
            // edit
            path.pop() // pop 'value' from path
            const { id } = getValueAtPath<PaneText>(pane, path)
            if (!newIds.has(id)) {
                edits.push({
                    id,
                    delta: op.e
                })
            }
        }
    })

    return edits
}
