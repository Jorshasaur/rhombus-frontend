import Delta from 'quill-delta'
import cuid from 'cuid'
import { SelectionState } from '../../../../data/reducers/selection'
import { getEditor } from '../../../../QuillRegistry'
import QuillSources from '../../../quill/modules/QuillSources'
import StyleChangeAnalytics from '../../../../analytics/AnalyticsBuilders/StyleChangeAnalytics'

export default function insertDivider(selection: SelectionState) {
    const index = selection.index! + selection.selectionLength! + 1
    const quill = getEditor(selection.editorId!)

    if (!quill) {
        return
    }

    quill.updateContents(
        new Delta().retain(index).insert('\n', { divider: true, id: cuid() }),
        QuillSources.USER
    )

    new StyleChangeAnalytics()
        .viaEditor()
        .appliedDivider()
        .track()
}
