import {
    DraggingStartAction,
    DraggingType,
    DraggingHoverAction,
    DraggingEndAction
} from '.'

export function startDraggingRow(rowIndex: number): DraggingStartAction {
    return {
        type: 'start',
        draggingType: DraggingType.Row,
        rowIndex
    }
}

export function startDraggingColumn(cellIndex: number): DraggingStartAction {
    return {
        type: 'start',
        draggingType: DraggingType.Column,
        cellIndex
    }
}

export function hover(
    rowIndex: number,
    cellIndex: number
): DraggingHoverAction {
    return { type: 'hover', rowIndex, cellIndex }
}

export function endDragging(): DraggingEndAction {
    return { type: 'end' }
}
