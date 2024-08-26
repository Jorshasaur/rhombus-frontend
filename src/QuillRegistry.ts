import Quill, { createQuillInstance } from './components/quill/entries/Editor'

const registry = new Map<string, Quill>()

export function createEditor(
    id: string,
    editorNode: Element | string,
    quillOptions: QuillOptions,
    useBlockEmbed: boolean
) {
    const QuillInstance = createQuillInstance(useBlockEmbed)
    const quillInstance = new QuillInstance(editorNode, quillOptions)
    registry.set(id, quillInstance)
    return quillInstance
}

export function registerEditor(id: string, quill: Quill) {
    registry.set(id, quill)
}

export function getEditor(id: string) {
    return registry.get(id)
}

export function getPaneEditorId(paneId: string, elementId: string) {
    return `${paneId}-${elementId}`
}

export function getPaneEditor(paneId: string, elementId: string) {
    return registry.get(getPaneEditorId(paneId, elementId))
}
