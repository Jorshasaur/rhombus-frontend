import { useCallback, useState } from 'react'
import Quill from '../components/quill/entries/Editor'
import { createEditor } from '../QuillRegistry'

type EditorElementType = Element | string

export function useCustomQuillInstance(
    id: string,
    quillOptions: QuillOptions,
    useBlockEmbed: boolean = true
): [(editorNode: string | Element | null) => void, Quill?, EditorElementType?] {
    const [quill, setQuill] = useState<Quill>()
    const [editorElement, setEditorElement] = useState<Element | string>()
    const ref = useCallback(
        (editorNode: string | Element | null) => {
            if (editorNode && !quill) {
                const customQuillInstance = createEditor(
                    id,
                    editorNode,
                    quillOptions,
                    useBlockEmbed
                )
                setQuill(customQuillInstance)
                setEditorElement(editorNode)
            }
        },
        [id, quill, quillOptions, setQuill, useBlockEmbed]
    )

    return [ref, quill, editorElement]
}
