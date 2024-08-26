import {
    DraggingState,
    DraggingStartAction,
    DraggingHoverAction,
    DraggingEndAction
} from '.'

export function draggingReducer(
    state: DraggingState,
    action: DraggingStartAction | DraggingHoverAction | DraggingEndAction
): DraggingState {
    switch (action.type) {
        case 'start':
            return {
                type: action.draggingType,
                rowIndex: action.rowIndex,
                cellIndex: action.cellIndex,
                dragging: true
            }
        case 'hover':
            return {
                ...state,
                hoveredRowIndex: action.rowIndex,
                hoveredCellIndex: action.cellIndex
            }
        case 'end':
            return { dragging: false }
        default:
            throw new Error()
    }
}

export type DraggingDispatch = React.Dispatch<
    React.ReducerAction<typeof draggingReducer>
>
