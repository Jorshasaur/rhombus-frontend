export interface DragOver {
    element: HTMLElement | null
    end: boolean
}

export interface NestedItem {
    element: HTMLElement
    items: HTMLElement[]
}

export enum DRAG_ITEM_TYPE {
    LINE,
    LIST,
    TODO_LIST,
    EMBED,
    DIVIDER,
    CODE_BLOCK
}

export interface DragItem {
    dragOver: DragOver
    dragEventHandler: (event: DragEvent) => void
    firstDraggingNode: HTMLElement
    draggingNodes: HTMLElement[] | NestedItem[]
    type: DRAG_ITEM_TYPE
    dragHandle?: boolean
}
