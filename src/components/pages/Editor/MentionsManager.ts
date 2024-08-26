import Quill from '../../quill/entries/Editor'
import { RangeStatic } from 'quill'
import {
    setMentionList,
    clearMentionList,
    setMentionMembers,
    updateSelectedMentionMember
} from '../../../data/actions'
import store from '../../../data/store'
import QuillEvents from '../../quill/modules/QuillEvents'
import MemberSearchManager from './MemberSearchManager'
import { DEFAULT_MENTIONS_TYPE } from '../../../constants/mentions'

interface MentionsManagerOptions {
    scrollContainer?: HTMLElement
    enabled?: boolean
    type?: string
    editorId?: string
}

export default class MentionsManager {
    memberSearchManager: MemberSearchManager
    scrollContainer: HTMLElement
    type: string
    editorId?: string

    constructor(private quill: Quill, options: MentionsManagerOptions = {}) {
        const enabled = options.enabled != null ? options.enabled : true

        if (enabled) {
            this.quill.on(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
            this.memberSearchManager = new MemberSearchManager()
            this.scrollContainer =
                options.scrollContainer || document.getElementById('app')!
            this.type = options.type || DEFAULT_MENTIONS_TYPE
            this.editorId = options.editorId
        }
    }

    detach() {
        this.quill.off(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
    }

    handleEditorChange = (eventName: string, ...args: any[]) => {
        if (eventName === QuillEvents.SELECTION_CHANGE) {
            this.handleSelectionChange(args[0])
        } else if (eventName === QuillEvents.TEXT_CHANGE) {
            const selection = this.quill.getSelection()
            this.handleSelectionChange(selection)
        }
    }

    handleSelectionChange = async (range?: RangeStatic) => {
        if (!range) {
            return
        }

        const state = store.getState()

        if (!state.mentions.showMentionsList) {
            return
        }

        if (
            typeof state.mentions.initialIndex === 'number' &&
            state.mentions.initialIndex > range.index
        ) {
            store.dispatch(clearMentionList())
            return
        }

        // Set everything for the first run
        const initialIndex =
            typeof state.mentions.initialIndex === 'number'
                ? state.mentions.initialIndex
                : range.index
        const mentionBounds = this.quill.getBounds(initialIndex, 1)
        const mentionText = this.quill.getText(
            initialIndex + 1,
            range.index - initialIndex - 1
        )
        const members = this.memberSearchManager.search(mentionText)
        if (
            (mentionText.length === 1 && mentionText === ' ') ||
            (mentionText.slice(-1) === ' ' && members.length === 0)
        ) {
            store.dispatch(clearMentionList())
        } else {
            if (
                mentionText.length &&
                typeof state.mentions.selectedMemberIndex !== 'number'
            ) {
                store.dispatch(updateSelectedMentionMember(0))
            }

            const navigationHeight = state.elementCoordinates.navigation.bottom
            const rootTop = this.quill.root.getBoundingClientRect().top
            const scrollTop = this.scrollContainer.scrollTop

            store.dispatch(setMentionMembers(members))
            store.dispatch(
                setMentionList(
                    true,
                    this.type,
                    this.editorId,
                    initialIndex,
                    range.index,
                    mentionBounds.top + rootTop + scrollTop - navigationHeight,
                    mentionBounds.left,
                    mentionText
                )
            )
        }
    }
}
