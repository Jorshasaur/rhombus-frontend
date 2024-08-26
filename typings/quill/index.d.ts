import * as Quill from 'quill'
import { Blot } from 'parchment/dist/src/blot/abstract/blot'
import ParchmentScrollBlot from 'parchment/dist/src/blot/scroll'
import { CommentMarking } from '../../src/components/quill/modules/CommentMarking'

declare module 'quill' {
    export type ScrollUpdateHandler = (
        source: Sources,
        mutations: MutationRecord[]
    ) => any

    interface NativeRange {
        start: {
            offset: number
            node: Node
        }
        end: {
            offset: number
            node: Node
        }
        native: Range
    }

    interface QuillSelection {
        getRange(): [RangeStatic, NativeRange]
        savedRange: RangeStatic
        rangeToNative(range: RangeStatic): [Node, number, Node, number]
    }
    export class History {
        options: {
            documentId?: string
            ignoreClear?: boolean
        }
        clear(): void
        cutoff(): void
        undo(): void
        redo(): void
    }

    interface KeyboardBinding {
        key: string
        shortKey?: boolean
        shiftKey?: boolean
        altKey?: boolean
        ctrlKey?: boolean
        metaKey?: boolean
        collapsed?: boolean
        prefix?: string
        suffix?: string
    }

    type KeyboardHandler = () => void

    export class Keyboard {
        addBinding(
            key: string | KeyboardBinding,
            context?: KeyboardBinding | KeyboardHandler,
            handler?: KeyboardHandler
        ): void
    }

    export interface ScrollBlot extends ParchmentScrollBlot {
        batch: boolean
    }

    export interface QuillEditor {
        delta: Delta
    }

    export interface DeltaStatic {
        invert(base: DeltaStatic): DeltaStatic
    }

    export interface Delta {
        invert(base: DeltaStatic): DeltaStatic
    }

    interface Quill {
        theme: any
        container: HTMLDivElement
        scrollingContainer: HTMLDivElement
        selection: QuillSelection
        editor: QuillEditor
        history: History
        keyboard: Keyboard
        on(
            eventName: 'scroll-update',
            handler: ScrollUpdateHandler
        ): EventEmitter
        once(
            eventName: 'scroll-update',
            handler: ScrollUpdateHandler
        ): EventEmitter
        off(
            eventName: 'scroll-update',
            handler: ScrollUpdateHandler
        ): EventEmitter

        setSelection(index: number | null, source?: Sources): void

        getModule(name: 'comment-marking'): CommentMarking
        scrollIntoView(): void
    }

    export class BlockEmbed extends Blot {
        domNode: HTMLElement

        constructor(domNode: HTMLElement)
        static create(value: any): HTMLElement
        static value(domNode: any): any
        value(domNode: any): any
        deleteAt(index: number, length: number): void
        formatAt(
            index: number,
            length: number,
            format: string,
            value: any
        ): void
        remove(): void
        offset(): number
        attach(): void
    }
    export class Embed {
        domNode: Node

        constructor(domNode: HTMLElement)
        static create(value: any): HTMLElement
        static value(domNode: any): any
        value(domNode: any): any
        deleteAt(index: number, length: number): void
        formatAt(
            index: number,
            length: number,
            format: string,
            value: any
        ): void
        remove(): void
    }
    export class Inline {
        domNode: Node
        constructor(domNode: Node)
        static create(value: any): Node
        static formats(domNode: any): any
        remove(): void
        detach(): void
        length(): number
    }
}
