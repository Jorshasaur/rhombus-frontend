import emojiPicker, { initialState } from '../../data/reducers/emojiPicker'
import { TypeKeys } from '../../data/ActionTypes'

describe('Emoji Picker reducer', () => {
    it('should return the initial state', () => {
        expect(
            emojiPicker(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })
    it('should set the emoji picker', () => {
        const emojiPickerData = {
            showEmojiPicker: true,
            initialIndex: 1,
            bottom: 2,
            left: 4,
            emojiText: 'dog',
            editorId: '12345'
        }
        expect(
            emojiPicker(undefined, {
                type: TypeKeys.SET_EMOJI_PICKER,
                data: {
                    ...emojiPickerData
                }
            })
        ).toEqual({
            ...initialState,
            ...emojiPickerData
        })
    })
    it('should clear the emoji picker', () => {
        expect(
            emojiPicker(undefined, {
                type: TypeKeys.CLEAR_EMOJI_PICKER
            })
        ).toEqual({
            ...initialState
        })
    })
})
