export const DEFAULT_QUILL_MODULE_OPTIONS = {
    keyboard: {
        emoji: {
            picker: false,
            shortcode: false
        },
        mentions: false
    },
    permissions: {
        canEdit: true
    },
    clipboard: {
        matchVisual: false
    },
    toolbar: false,
    'multi-cursor': false,
    authorship: {
        enabled: false
    },
    history: {
        userOnly: true
    },
    emoji: false,
    'emoji-picker-manager': false,
    'file-paste': false,
    'file-drop': false,
    'mentions-manager': false,
    'selection-manager': false,
    'mouseover-manager': false,
    'authors-manager': false,
    placeholder: { enabled: false }
}
