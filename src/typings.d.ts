declare module 'quill-cursors/*'
declare module 'node_modules/quill/modules/clipboard' {
    class Clipboard {
        constructor(quill: any, options: any)
    }
}

declare module '*.svg' {
    const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
    export default ReactComponent
}

declare module '*.module.css' {
    const content: any
    export default content
}

declare module '*.png' {
    const content: any
    export default content
}

interface EventProperties {
    [key: string]: any
}

interface Measure {
    initializeSegment(): void
    identifyUser(): void
    page(label?: string, category?: string): void
    collect(eventName: string, properties?: EventProperties): void
}

interface Window {
    IN: any
    INVISION_ENV: any
    __call$?: any
    quill?: any
    Parchment?: any
    Delta?: any
    measure?: Measure
    PagesApiService: any
    UploadManager: any
    otEditorClient: any
    store: any
    hasUnsavedComments: () => boolean
    slowAnimations: boolean
    updateQuillPermissions: (permissions: any) => void
    documentId: string
    setDevMode?: any
    removeDevMode?: any
    devModeHelpers?: any
    getLargeEmbedWidth: () => number
    historyQuill?: any
    QuillRegistry?: any
    OTClientRegistry?: any
}
