export enum DraggingType {
    Row = 'row',
    Column = 'column'
}

export interface DraggingState {
    dragging: boolean
    type?: DraggingType
    rowIndex?: number
    cellIndex?: number
    hoveredRowIndex?: number
    hoveredCellIndex?: number
}

export const DraggingInitialState: DraggingState = {
    dragging: false
}

export interface DraggingStartAction {
    type: 'start'
    draggingType: DraggingType
    rowIndex?: number
    cellIndex?: number
}

export interface DraggingEndAction {
    type: 'end'
}

export interface DraggingHoverAction {
    type: 'hover'
    rowIndex: number
    cellIndex: number
}
