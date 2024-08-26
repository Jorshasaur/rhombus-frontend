import { BlotSize } from './blotSize'

export interface Embed {
    isEmbed: boolean
    domNode: HTMLElement
    editorId: string | null
    select(index: number): void
    highlight(): void
    unhighlight(): void
    addMark(id: string): void
    removeMark(id: string): void
    viewable(): boolean
    unviewable(): boolean | undefined
    setSize(size: BlotSize): void
}
