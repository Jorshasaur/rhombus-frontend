import AnalyticsBuilder from './AnalyticsBuilder'
import { FILE_TYPES, URL_TYPES } from '../../helpers/EmbedHelper'

const EMBED_ADD = {
    event: 'App.Rhombus.Embed.Added',
    properties: {
        method: {
            name: 'method',
            PLUS_BUTTON: 'AddedVia.PlusButton',
            EMBED_MODAL: 'AddedVia.EmbedModal',
            EMBED_MODAL_CREATE: 'CreatedVia.EmbedModal',
            DRAG_DROP: 'AddedVia.DragDrop',
            PASTE: 'AddedVia.Paste'
        },
        type: {
            name: 'type',
            FILE: 'EmbedType.isFile',
            URL: 'EmbedType.isURL'
        },
        subType: {
            name: 'subType',
            PROTOTYPE_DOC_VIEWER: 'EmbedType.isPrototypeDocViewer',
            FREEHAND: 'EmbedType.isFreehand',
            EXTERNAL_URL: 'EmbedType.isExternalURL',
            PNG: 'EmbedType.isPNG',
            JPEG: 'EmbedType.isJPEG',
            PDF: 'EmbedType.isPDF',
            MP4: 'EmbedType.isMp4',
            MOV: 'EmbedType.isMov',
            STUDIO: 'EmbedType.isStudio',
            SKETCH: 'EmbedType.isSketch'
        }
    }
}

export default class EmbedAddAnalytics extends AnalyticsBuilder {
    protected eventName: string = EMBED_ADD.event

    constructor() {
        super()
    }

    // methods
    public viaPlusButton = () =>
        this.withProperty(
            EMBED_ADD.properties.method.name,
            EMBED_ADD.properties.method.PLUS_BUTTON
        )

    public viaEmbedModal = () =>
        this.withProperty(
            EMBED_ADD.properties.method.name,
            EMBED_ADD.properties.method.EMBED_MODAL
        )

    public viaEmbedModalCreate = () =>
        this.withProperty(
            EMBED_ADD.properties.method.name,
            EMBED_ADD.properties.method.EMBED_MODAL_CREATE
        )

    public viaDragDrop = () =>
        this.withProperty(
            EMBED_ADD.properties.method.name,
            EMBED_ADD.properties.method.DRAG_DROP
        )

    public viaPaste = () =>
        this.withProperty(
            EMBED_ADD.properties.method.name,
            EMBED_ADD.properties.method.PASTE
        )

    // types
    public isFile = () =>
        this.withProperty(
            EMBED_ADD.properties.type.name,
            EMBED_ADD.properties.type.FILE
        )

    public isURL = () =>
        this.withProperty(
            EMBED_ADD.properties.type.name,
            EMBED_ADD.properties.type.URL
        )

    // subTypes
    public isPrototypeDocViewer = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.PROTOTYPE_DOC_VIEWER
        )

    public isFreehand = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.FREEHAND
        )

    public isExternalURL = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.EXTERNAL_URL
        )

    public isPNG = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.PNG
        )

    public isJPEG = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.JPEG
        )

    public isPDF = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.PDF
        )

    public isMp4 = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.MP4
        )

    public isMov = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.MOV
        )

    public isStudio = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.STUDIO
        )

    public isSketch = () =>
        this.withProperty(
            EMBED_ADD.properties.subType.name,
            EMBED_ADD.properties.subType.SKETCH
        )

    public fileType = (fileType: FILE_TYPES) => {
        switch (fileType) {
            case FILE_TYPES.mov:
                return this.isMov()
            case FILE_TYPES.mp4:
                return this.isMp4()
            case FILE_TYPES.pdf:
                return this.isPDF()
            case FILE_TYPES.png:
                return this.isPNG()
            case FILE_TYPES.jpeg:
                return this.isJPEG()
            case FILE_TYPES.sketch:
                return this.isSketch()
            case FILE_TYPES.studio:
                return this.isStudio()
            default:
                return this
        }
    }

    public urlType = (urlType: URL_TYPES) => {
        switch (urlType) {
            case URL_TYPES.freehand:
                return this.isFreehand()
            case URL_TYPES.prototype:
            case URL_TYPES.invision:
                return this.isPrototypeDocViewer()
            default:
                return this.isExternalURL()
        }
    }
}
