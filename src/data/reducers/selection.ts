import { AnyAction } from 'redux'
import { SelectionType } from '../../interfaces/selectionType'
import { TypeKeys } from '../ActionTypes'
export interface SelectionState {
    activeEmbed: string | null
    editorId: string | null
    mainEditor: boolean
    index: number | null
    selectionLength: number | null
    selectionType: SelectionType
    blotName: string

    isFirstLine: boolean

    text: string | null
    blockquote: boolean
    header: number | null
    codeBlock: boolean
    list: string | null
    bold: boolean
    italic: boolean
    link: string | null
    strike: boolean
    underline: boolean
    left?: number
    top?: number
    bottom?: number
    width?: number
    height?: number
}

export const initialTypeStyleState = {
    activeEmbed: null,
    blockquote: false,
    header: null,
    codeBlock: false,
    list: null
}

export const initialState: SelectionState = {
    ...initialTypeStyleState,
    bold: false,
    italic: false,
    link: null,
    strike: false,
    underline: false,
    isFirstLine: true,
    editorId: null,
    mainEditor: false,
    index: null,
    selectionLength: null,
    selectionType: SelectionType.Text,
    blotName: '',
    text: null
}

export const blockTypeStyles = ['header', 'list', 'codeBlock', 'blockquote']

export const selection = (
    state: SelectionState = initialState,
    action: AnyAction
) => {
    const { type, data } = action
    switch (type) {
        case TypeKeys.FORMAT_SELECTION:
            const { format, value } = data
            if (blockTypeStyles.indexOf(format) > -1) {
                return { ...state, ...initialTypeStyleState, [format]: value }
            }
            return { ...state, [format]: value }
        case TypeKeys.CLEAR_SELECTION:
            return initialState
        case TypeKeys.SELECTION_CHANGED:
            return { ...state, ...initialState, ...data }
        case TypeKeys.SELECTION_INDEX_CHANGED:
            return { ...state, index: data.index }
        default:
            return state
    }
}
