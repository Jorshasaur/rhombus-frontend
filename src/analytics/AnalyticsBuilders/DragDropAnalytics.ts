import AnalyticsBuilder from './AnalyticsBuilder'

const DRAG_DROP = {
    event: 'App.Rhombus.Rearranged',
    properties: {
        status: {
            name: 'status',
            COMPLETE: 'DragAction.isComplete',
            INCOMPLETE: 'DragAction.isIncomplete'
        },
        type: {
            name: 'type',
            TEXT: 'DraggedType.isText',
            LIST: 'DraggedType.isList',
            IMAGE: 'DraggedType.isImage',
            VIDEO: 'DraggedType.isVideo',
            EXTERNAL_URL_BLOT: 'DraggedType.isExternalURLBlot',
            FILE_BLOT: 'DraggedType.isFileBlot',
            PROTOTYPE: 'DraggedType.isPrototype',
            FREEHAND: 'DraggedType.isFreehand'
        }
    }
}

export default class DragDropAnalytics extends AnalyticsBuilder {
    protected eventName: string = DRAG_DROP.event

    constructor() {
        super()
    }

    // status
    public isComplete = () =>
        this.withProperty(
            DRAG_DROP.properties.status.name,
            DRAG_DROP.properties.status.COMPLETE
        )

    public isIncomplete = () =>
        this.withProperty(
            DRAG_DROP.properties.status.name,
            DRAG_DROP.properties.status.INCOMPLETE
        )

    // type
    public isText = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.TEXT
        )

    public isList = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.LIST
        )

    public isImage = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.IMAGE
        )

    public isVideo = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.VIDEO
        )

    public isExternalURLBlot = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.EXTERNAL_URL_BLOT
        )

    public isFileBlot = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.FILE_BLOT
        )

    public isPrototype = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.PROTOTYPE
        )

    public isFreehand = () =>
        this.withProperty(
            DRAG_DROP.properties.type.name,
            DRAG_DROP.properties.type.FREEHAND
        )

    public itemType = (itemType: string) => {
        switch (itemType) {
            case 'text':
                return this.isText()
            case 'list':
                return this.isList()
            case 'image':
                return this.isImage()
            case 'video':
                return this.isVideo()
            case 'file':
                return this.isFileBlot()
            case 'marvel':
            case 'youtube':
            case 'vimeo':
            case 'soundcloud':
            case 'spotify':
            case 'linkedin':
                return this.isExternalURLBlot()
            case 'prototype':
            case 'invision':
                return this.isPrototype()
            case 'freehand':
                return this.isFreehand()
            default:
                return this
        }
    }
}
