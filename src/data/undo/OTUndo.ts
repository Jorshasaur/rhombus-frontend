import { OTOperationGeneric } from '../panes/OTClient'
import { EventEmitter2 } from 'eventemitter2'

interface Change<T extends OTOperationGeneric<T>> {
    undo: T
    redo: T
}

interface Stack<T extends OTOperationGeneric<T>> {
    undo: Change<T>[]
    redo: Change<T>[]
}

type ChangeType = 'undo' | 'redo'

interface OTUndoOptions<T> {
    maxStack?: number
    delay?: number
    isEmptyOp: (op: T) => boolean
}

type RequiredOptions<T> = Required<OTUndoOptions<T>>

const RECORD_EVENT = 'record'

export default class OTUndo<T extends OTOperationGeneric<T>> {
    static defaultOptions = {
        maxStack: 100,
        delay: 1000
    }
    private options: RequiredOptions<T>
    private lastRecorded = 0
    private stack: Stack<T> = {
        undo: [],
        redo: []
    }
    private emitter = new EventEmitter2()

    constructor(options: OTUndoOptions<T>) {
        this.options = {
            ...OTUndo.defaultOptions,
            ...options
        }
    }

    onDidRecord(fn: () => void) {
        this.emitter.on(RECORD_EVENT, fn)
    }

    record(changeOp: T, inverseOp: T) {
        let newRecorded = true
        this.stack.redo = []
        const timestamp = Date.now()
        let undoOp = inverseOp

        if (
            this.lastRecorded + this.options.delay > timestamp &&
            this.stack.undo.length > 0
        ) {
            // change composed with previous record
            const change = this.stack.undo.pop()!
            undoOp = undoOp.compose(change.undo)
            changeOp = change.redo.compose(changeOp)
            newRecorded = false
        } else {
            this.lastRecorded = timestamp
        }
        if (this.options.isEmptyOp(undoOp)) {
            return
        }
        this.stack.undo.push({
            redo: changeOp,
            undo: undoOp
        })
        if (this.stack.undo.length > this.options.maxStack) {
            this.stack.undo.shift()
        }

        if (newRecorded) {
            this.emitter.emit(RECORD_EVENT)
        }

        return newRecorded
    }

    clear() {
        this.stack = { undo: [], redo: [] }
    }

    cutoff() {
        this.lastRecorded = 0
    }

    transform(op: T) {
        this.transformStack(this.stack.undo, op, 'undo', 'redo')
        this.transformStack(this.stack.redo, op, 'redo', 'undo')
    }

    private transformStack(
        stack: Change<T>[],
        op: T,
        from: ChangeType,
        to: ChangeType
    ) {
        let remoteOp = op
        for (let i = stack.length - 1; i >= 0; i -= 1) {
            const change = stack[i]
            const oldOp = change[from]
            change[from] = remoteOp.transform(oldOp, true)
            change[to] = remoteOp.transform(change[to], true)
            remoteOp = oldOp.transform(remoteOp, false)
            if (this.options.isEmptyOp(change[from])) {
                stack.splice(i, 1)
            }
        }
    }

    canUndo(): boolean {
        return this.stack.undo.length > 0
    }

    canRedo(): boolean {
        return this.stack.redo.length > 0
    }

    undo(): T | null {
        return this.change('undo', 'redo')
    }

    redo(): T | null {
        return this.change('redo', 'undo')
    }

    private change(source: ChangeType, dest: ChangeType): T | null {
        if (this.stack[source].length === 0) {
            return null
        }

        const change = this.stack[source].pop()!
        this.stack[dest].push(change)
        this.lastRecorded = 0

        return change[source]
    }
}
