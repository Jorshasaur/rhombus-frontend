interface QuillOptions {
    modules: {
        keyboard: {
            emoji: {
                picker: boolean
                shortcode: boolean
            }
            mentions: boolean
        }
        permissions: {
            canEdit: boolean
        }
        clipboard: {
            matchVisual: boolean
        }
        toolbar: boolean
        'multi-cursor': boolean
        authorship: {
            enabled: boolean
        }
        history: {
            userOnly: boolean
            documentId?: string
        }
        emoji: boolean
        'emoji-picker-manager': {
            enabled: boolean
            editorId?: string
        }
        'file-paste': boolean
        'file-drop': boolean
        'mentions-manager':
            | {
                  enabled?: boolean
                  editorId?: string
              }
            | boolean
        'selection-manager': {
            enabled: boolean
            editorId?: string
            mainEditor?: boolean
            embedId?: string
        }
        'mouseover-manager': boolean
        'authors-manager': boolean
        placeholder: { enabled: boolean }
    }
    placeholder?: string
    theme: string
}
