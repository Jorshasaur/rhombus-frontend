import { EventEmitter2, Listener } from 'eventemitter2'
import json1 from 'ot-json1'
import { DeltaStatic } from 'quill-delta'
import { VError } from 'verror'
import bugsnag from '../../bugsnag'
import { log } from '../../helpers/LogHelper'
import * as AdvilOps from './AdvilOps'
import { AdvilUndo } from './AdvilUndo'
import { OTEditorAdapterCallbacks, OTOperation } from './OTClient'

json1.type.registerSubtype(require('rich-text'))

export class ListDoesntExistError extends Error {
    constructor(id: string) {
        super(`The requested list ${id} cannot be found.`)
    }
}

export class ElementDoesntExistError extends Error {
    constructor(id: string) {
        super(`The requested element id(${id}) cannot be found.`)
    }
}

/**
Pane {
    id: string,
    viewType: PaneViewType
    elements: [
        {
            PaneList: {
                id: string,
                elements: [
                    { PaneElement }
                ]
            }
        }
    ]
}
 */

export interface PaneList {
    id: string
    metadata: {
        columnSizes?: {
            [index: number]: number
        }
    }
    elements: PaneList[] | PaneElement[]
}

export interface Pane extends PaneList {
    viewType: PaneViewType
}

export type PaneElement = PaneImage | PaneSelect | PaneText

export interface IPaneElement {
    id: string
    type: PaneElementType
    threadIds?: string[]
}

export interface PaneImage extends IPaneElement {
    type: PaneElementType.IMAGE
    value: {
        height: number
        id: string
        width: number
    }
}

export interface PaneSelect extends IPaneElement {
    type: PaneElementType.SELECT
    value: string
}

export interface PaneText extends IPaneElement {
    type: PaneElementType.TEXT
    value: DeltaStatic
}

export enum PaneElementType {
    TEXT = 'text',
    IMAGE = 'image',
    SELECT = 'select'
}

export enum PaneViewType {
    TABLE = 'table'
}

export enum AdvilEvents {
    SEND = 'send',
    UPDATE = 'update'
}

export enum AdvilUpdateSource {
    SERVER = 'server',
    UNDO = 'undo'
}

export type ColumnSizeUpdate = [string, number | null][]

type UpdateEventCallback = (
    pane: Pane,
    operation: JSON1Wrapper,
    source: AdvilUpdateSource
) => void

export class JSON1Wrapper implements OTOperation {
    ops: json1.JSONOp
    inverse: json1.JSONOp
    constructor(operation: json1.JSONOp, inverse?: json1.JSONOp) {
        this.ops = operation
        if (inverse) {
            this.inverse = inverse
        }
    }

    compose(other: JSON1Wrapper) {
        if (this.inverse && other.inverse) {
            return new JSON1Wrapper(
                json1.type.compose(this.ops, other.ops),
                json1.type.compose(other.inverse, this.inverse)
            )
        }
        return new JSON1Wrapper(json1.type.compose(this.ops, other.ops))
    }

    transform(other: JSON1Wrapper, priority?: boolean) {
        const side: 'left' | 'right' = priority === false ? 'right' : 'left'
        // The order here from Delta is reversed: serverOp.transform(clientOp, true),
        // which is actually transform(clientOp, serverOp, 'left')
        // so we need to switch to json1.type.transformNoConflict(other.ops!, this.ops, side)
        if (other.inverse) {
            return new JSON1Wrapper(
                json1.type.transformNoConflict(other.ops, this.ops, side),
                json1.type.transformNoConflict(other.inverse, this.ops, side)
            )
        }
        return new JSON1Wrapper(
            json1.type.transformNoConflict(other.ops, this.ops, side)
        )
    }

    transformPosition(index: number, priority?: boolean) {
        return 0
    }

    invert() {
        return new JSON1Wrapper(this.inverse, this.ops)
    }
}

// Advil is for Pane Management.  Aren't we so clever.
export default class Advil {
    pane: Pane
    paneId: string
    callbacks: OTEditorAdapterCallbacks
    history = new AdvilUndo(this)
    private emitter = new EventEmitter2()

    constructor(paneId: string) {
        this.paneId = paneId
    }

    initialize(paneContents: Pane) {
        this.pane = json1.type.create(paneContents)
    }

    public registerCallbacks(callbacks: OTEditorAdapterCallbacks) {
        this.callbacks = callbacks
    }

    editColumnSizes(updatedColumns: ColumnSizeUpdate) {
        const [op, inverseOp] = AdvilOps.editColumnSizes(
            this.pane,
            updatedColumns
        )
        if (op.length && inverseOp.length) {
            this.applyTransformOnPane(op, inverseOp)
        }
    }

    createList(elements?: PaneElement[], position?: number, listId?: string) {
        const [op, inverseOp] = AdvilOps.addList(
            this.pane,
            elements,
            position,
            listId
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    removeList(listId: string) {
        const [op, inverseOp] = AdvilOps.removeList(this.pane, listId)
        this.applyTransformOnPane(op, inverseOp)
    }

    moveList(listId: string, destination: number) {
        const [op, inverseOp] = AdvilOps.moveList(
            this.pane,
            listId,
            destination
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    moveListByIndex(origin: number, destination: number) {
        const [op, inverseOp] = AdvilOps.moveListByIndex(
            this.pane,
            origin,
            destination
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    addElementToListAtPosition(
        listId: string,
        position: number,
        paneElement: PaneElement
    ) {
        const [op, inverseOp] = AdvilOps.addElementToListAtPosition(
            this.pane,
            listId,
            position,
            paneElement
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    addElementToListsAtPosition(
        listIds: string[],
        position: number,
        paneElementCallback: () => PaneElement
    ) {
        const [op, inverseOp] = AdvilOps.addElementToListsAtPosition(
            this.pane,
            listIds,
            position,
            paneElementCallback
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    addElementToList(listId: string, paneElement: PaneElement) {
        const [op, inverseOp] = AdvilOps.addElementToList(
            this.pane,
            listId,
            paneElement
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    removeElementFromList(listId: string, elementPosition: number) {
        const [op, inverseOp] = AdvilOps.removeElementFromList(
            this.pane,
            listId,
            elementPosition
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    removeElementsFromList(listIds: string[], elementPosition: number) {
        const [op, inverseOp] = AdvilOps.removeElementsFromList(
            this.pane,
            listIds,
            elementPosition
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    moveElementInList(listId: string, position: number, destination: number) {
        const [op, inverseOp] = AdvilOps.moveElementThroughLists(
            this.pane,
            listId,
            position,
            listId,
            destination
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    moveElementThroughLists(
        originListId: string,
        originPosition: number,
        destinationListId: string,
        destinationPosition: number
    ) {
        const [op, inverseOp] = AdvilOps.moveElementThroughLists(
            this.pane,
            originListId,
            originPosition,
            destinationListId,
            destinationPosition
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    moveListsElements(originPosition: number, destinationPosition: number) {
        const [op, inverseOp] = AdvilOps.moveListsElements(
            this.pane,
            originPosition,
            destinationPosition
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    replaceElementAt(
        listId: string,
        position: number,
        newElement: PaneElement
    ) {
        const [op, inverseOp] = AdvilOps.replaceElementAt(
            this.pane,
            listId,
            position,
            newElement
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    replaceElementPropertyAt(
        listId: string,
        position: number,
        propertyPath: json1.Path,
        newValue: any
    ) {
        const [op, inverseOp] = AdvilOps.replaceElementPropertyAt(
            this.pane,
            listId,
            position,
            propertyPath,
            newValue
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    addImage(listId: string, height: number, width: number) {
        const [op, inverseOp] = AdvilOps.addImage(
            this.pane,
            listId,
            height,
            width
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    addText(listId: string, initialDelta: DeltaStatic) {
        const [op, inverseOp] = AdvilOps.addText(
            this.pane,
            listId,
            initialDelta
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    editText(listId: string, textId: string, delta: DeltaStatic) {
        const [op, inverseOp] = AdvilOps.editText(
            this.pane,
            listId,
            textId,
            delta
        )
        this.applyTransformOnPane(op, inverseOp)
    }

    applyTransformOnPane(op: json1.JSONOp, inverse: json1.JSONOp) {
        try {
            const wrapper = new JSON1Wrapper(op, inverse)
            this.pane = json1.type.apply(this.pane, op)
            this.history.record(wrapper)
            this.sendOperation(wrapper)
        } catch (error) {
            bugsnag.notify(new VError(error, 'FailedOperation'), {
                metadata: {
                    operation: op,
                    paneId: this.pane.id,
                    paneViewType: this.pane.viewType
                }
            })
        }
    }

    private emit(event: AdvilEvents) {
        this.emitter.emit(event)
    }

    on(event: AdvilEvents.UPDATE, fn: UpdateEventCallback): void
    on(event: AdvilEvents.SEND, fn: () => void): void
    on(event: AdvilEvents, fn: Listener): void {
        this.emitter.on(event, fn)
    }

    sendOperation(wrapper: JSON1Wrapper) {
        this.callbacks.operation(wrapper, wrapper.invert())
        this.emit(AdvilEvents.SEND)
    }

    applyOperation(operation: JSON1Wrapper) {
        log('[Advil] - apply incoming operation', operation)

        // apply incoming operation to the pane
        this.pane = json1.type.apply(this.pane, operation.ops!)

        // transform undo stack with incoming operation
        this.history.transform(operation)

        // update pane view
        this.emitUpdate(operation, AdvilUpdateSource.SERVER)
    }

    emitUpdate(operation: JSON1Wrapper, source: AdvilUpdateSource) {
        this.emitter.emit(AdvilEvents.UPDATE, this.pane, operation, source)
    }

    applyUndoOperation(operation: JSON1Wrapper) {
        log('[Advil] - apply undo operation ', operation)

        // apply undo operation to the pane
        this.pane = json1.type.apply(this.pane, operation.ops)

        // send undo operation to the server
        this.sendOperation(operation)

        // update pane view
        this.emitUpdate(operation, AdvilUpdateSource.UNDO)
    }

    disconnect() {
        this.emitter.removeAllListeners()
    }
}
