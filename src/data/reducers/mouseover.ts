import { AnyAction } from 'redux'
import { BlotSize } from '../../interfaces/blotSize'
import { SelectionType } from '../../interfaces/selectionType'
import { TypeKeys } from '../ActionTypes'

export interface ResizableBlotData {
    size?: BlotSize
}

export type MouseOverBlotData = ResizableBlotData | undefined

export interface MouseOverState {
    index: number
    blotType: SelectionType
    blotName: string
    blotData: MouseOverBlotData
    top: number
    height: number
    id: string
}

export const initialState = {}

export default function mouseover(
    state: MouseOverState | {} = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_MOUSEOVER:
            return {
                index: data.index,
                blotName: data.blotName,
                blotType: data.blotType,
                blotData: data.blotData,
                top: data.top,
                height: data.height,
                id: data.id
            }
        case TypeKeys.SET_MOUSEOVER_INDEX:
            return { ...state, index: data.index }
        case TypeKeys.RESET_MOUSEOVER:
            return {}
        default:
            return state
    }
}
