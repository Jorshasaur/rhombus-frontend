import { MAIN_EDITOR_ID } from '../constants/general'

export const getBlotPositioning = (
    blot: HTMLElement,
    editor?: HTMLElement | null
) => {
    const mainEditor = editor || document.getElementById(MAIN_EDITOR_ID)
    const mainEditorScrollTop = mainEditor?.scrollTop ?? 0

    return {
        left: blot.offsetLeft,
        top: blot.offsetTop - mainEditorScrollTop,
        width: blot.offsetWidth
    }
}
