import * as AdvilOps from '../../../../../data/panes/AdvilOps'
import QuillSources from '../../../../quill/modules/QuillSources'
import * as QuillRegistry from '../../../../../QuillRegistry'
import { getLastChangeIndex } from '../../../../../data/undo/QuillUndo'
import {
    Pane,
    JSON1Wrapper,
    AdvilUpdateSource
} from '../../../../../data/panes/Advil'

export function handlePaneUpdate(
    pane: Pane,
    operation: JSON1Wrapper,
    source: AdvilUpdateSource
) {
    const edits = AdvilOps.getTextEdits(pane, operation.ops)
    const sourceIsUndo = source === AdvilUpdateSource.UNDO

    for (const { id, delta } of edits) {
        const editor = QuillRegistry.getPaneEditor(pane.id, id)
        if (!editor) {
            continue
        }

        if (sourceIsUndo) {
            // source must be QuillSources.SILENT because we already set change to pane with updatePane function
            editor.updateContents(delta, QuillSources.SILENT)
            const index = getLastChangeIndex(delta)
            editor.setSelection(index)
        } else {
            editor.updateContents(delta, QuillSources.API)
        }
    }
}
