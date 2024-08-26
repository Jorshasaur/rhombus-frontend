import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export interface EmojiPickerState {
    initialIndex?: number
    left: number
    selectedMemberIndex?: number
    showEmojiPicker: boolean
    bottom: number
    emojiText: string
    editorId?: string
}

export const initialState = {
    emojiText: '',
    left: 0,
    showEmojiPicker: false,
    bottom: 0
}

export default function emojiPicker(
    state: EmojiPickerState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.CLEAR_EMOJI_PICKER:
            return {
                ...state,
                showEmojiPicker: false,
                emojiText: '',
                initialIndex: undefined,
                editorId: undefined
            }
        case TypeKeys.SET_EMOJI_PICKER:
            return { ...state, ...data }
        default:
            return state
    }
}
