import Quill from 'quill/core'
import QuillSources from '../../quill/modules/QuillSources'
import store from '../../../data/store'
import { clearMentionList } from '../../../data/actions'
import { Member } from '../../../interfaces/member'

export default function insertMention(
    quill: Quill,
    initialIndex: number,
    currentIndex: number,
    mentionType: string,
    value: Member | string
) {
    quill.deleteText(
        initialIndex!,
        currentIndex! - initialIndex!,
        QuillSources.USER
    )
    quill.insertEmbed(initialIndex!, mentionType, value, QuillSources.USER)
    quill.focus()
    quill.setSelection(initialIndex! + 1, QuillSources.SILENT)
    store.dispatch(clearMentionList())
}
