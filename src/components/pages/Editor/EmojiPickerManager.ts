import Quill from '../../quill/entries/Editor'
import { Sources } from 'quill'
import { setEmojiPicker, clearEmojiPicker } from '../../../data/actions'
import DeltaStatic from 'quill-delta'
import store from '../../../data/store'
import QuillEvents from '../../quill/modules/QuillEvents'
import { TRIGGER_EMOJI_CHARACTERS_LEN } from '../../../constants/emoji'
import { REG_EX_PATTERNS } from '../../../constants/keyboard'
import QuillSources from '../../quill/modules/QuillSources'
import { get } from 'lodash'
import { EmojiPickerState } from '../../../data/reducers/emojiPicker'

interface Options {
    enabled: boolean
    editorId?: string
}

export default class EmojiPickerManager {
    private editorId?: string

    constructor(private quill: Quill, options: Options) {
        if (options.enabled) {
            this.editorId = options.editorId
            this.quill.on(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
        }
    }

    detach() {
        this.quill.off(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
    }

    handleEditorChange = (
        eventName: string,
        delta: DeltaStatic,
        oldDelta: DeltaStatic,
        source: Sources
    ) => {
        if (eventName === QuillEvents.TEXT_CHANGE) {
            this.handleTextChange(delta, oldDelta, source)
        }
    }

    handleTextChange = async (
        delta: DeltaStatic,
        oldContents: DeltaStatic,
        source: Sources
    ) => {
        const state = store.getState()
        const { emojiPicker } = state
        const { showEmojiPicker } = emojiPicker
        const { codeBlock } = state.selection
        if (codeBlock) {
            return
        }

        const selectionIndex = get(this.quill.getSelection(), 'index', -1)

        if (selectionIndex < 0) {
            return
        }

        // if emoji picker is shown and we get text change from other user then update initial index
        if (showEmojiPicker && source === QuillSources.API) {
            const initialIndex = delta.transformPosition(
                emojiPicker.initialIndex!
            )

            if (
                this._colonDeletedByOtherUser(
                    delta,
                    selectionIndex,
                    initialIndex
                )
            ) {
                store.dispatch(clearEmojiPicker())
                return
            }

            store.dispatch(
                setEmojiPicker(
                    emojiPicker.showEmojiPicker,
                    initialIndex,
                    emojiPicker.bottom,
                    emojiPicker.left,
                    emojiPicker.emojiText,
                    this.editorId
                )
            )
            return
        }

        if (
            delta.ops &&
            delta.ops.length === 2 &&
            delta.ops[0].retain &&
            delta.ops[1].insert &&
            typeof delta.ops[1].insert === 'string'
        ) {
            if (
                showEmojiPicker || // we're already showing it, just update values
                this._getMatch(selectionIndex) // show it for the first time
            ) {
                const initialIndex = this._getInitialIndex(
                    emojiPicker,
                    selectionIndex
                )

                const { emojiBounds, searchText } = this._getStringData(
                    selectionIndex,
                    initialIndex
                )

                store.dispatch(
                    setEmojiPicker(
                        true,
                        initialIndex,
                        emojiBounds.bottom,
                        emojiBounds.left,
                        searchText,
                        this.editorId
                    )
                )
            }
        } else if (
            showEmojiPicker &&
            delta.ops &&
            delta.ops.length === 2 &&
            delta.ops[0].retain &&
            delta.ops[1].delete
        ) {
            const initialIndex = emojiPicker.initialIndex!
            const { emojiBounds, searchText } = this._getStringData(
                selectionIndex,
                initialIndex
            )

            // hide the picker when you delete all search text
            if (selectionIndex <= initialIndex + 1) {
                store.dispatch(clearEmojiPicker())
                // otherwise just update search values
            } else {
                store.dispatch(
                    setEmojiPicker(
                        true,
                        initialIndex,
                        emojiBounds.bottom,
                        emojiBounds.left,
                        searchText,
                        this.editorId
                    )
                )
            }
        }
    }

    _colonDeletedByOtherUser(
        delta: DeltaStatic,
        selectionIndex: number,
        initialIndex: number
    ) {
        return (
            delta.ops &&
            delta.ops.length === 2 &&
            !!delta.ops[0].retain &&
            !!delta.ops[1].delete &&
            selectionIndex <= initialIndex + 1
        )
    }

    private _getInitialIndex(
        emojiPicker: EmojiPickerState,
        selectionIndex: number
    ) {
        if (emojiPicker.showEmojiPicker) {
            return emojiPicker.initialIndex!
        } else {
            return selectionIndex - TRIGGER_EMOJI_CHARACTERS_LEN
        }
    }

    // `match` enables us to only show the emoji picker for the user who invoked it
    private _getMatch(selectionIndex: number) {
        const text = this.quill.getText(
            selectionIndex - TRIGGER_EMOJI_CHARACTERS_LEN,
            TRIGGER_EMOJI_CHARACTERS_LEN
        )

        return text.match(REG_EX_PATTERNS.emojiShortnameMidline)
    }

    private _getStringData = (index: number, initialIndex: number) => {
        const searchText = this.quill.getText(
            initialIndex + 1,
            index - initialIndex - 1
        )

        const emojiBounds = this.quill.getBounds(index, 1)
        return {
            emojiBounds,
            searchText
        }
    }
}
