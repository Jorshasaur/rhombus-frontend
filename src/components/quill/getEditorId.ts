import { Blot } from 'parchment/dist/src/blot/abstract/blot'

export function getEditorId(blot: Blot): string | undefined {
    const container = blot.scroll?.domNode?.parentNode as HTMLElement | null
    if (!container) {
        return
    }

    return container.dataset.editorId
}

export function getEditorInfo(blot: Blot) {
    const container = blot.scroll?.domNode?.parentNode as HTMLElement | null
    if (!container) {
        return
    }

    const { editorId, mainEditor, embedId } = container.dataset

    return {
        editorId,
        embedId,
        mainEditor: mainEditor === 'true'
    }
}
