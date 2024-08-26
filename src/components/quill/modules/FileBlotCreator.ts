import PubSub from 'pubsub-js'
import { BlockEmbed } from 'quill'
import Quill from 'quill/core'
import EmbedAddAnalytics from '../../../analytics/AnalyticsBuilders/EmbedAddAnalytics'
import { DOCUMENT_CHANGE_UPDATE } from '../../../constants/topics'
import { setAssets } from '../../../data/actions'
import store from '../../../data/store'
import { UploadManager } from '../../../data/Uploader'
import {
    FILE_CREATE_METHOD,
    FILE_TYPES,
    getEmbedType
} from '../../../helpers/EmbedHelper'
import QuillSources from './QuillSources'
const Parchment = Quill.import('parchment')

type FileTasks = Array<Promise<[File, BlockEmbed] | void>>
interface Options {
    index?: number
    allowedTypesRegExp?: RegExp
    embedOptions?: any
    getEmbedOptions?: Function
}
const defaultOptions = {}

export default class FileBlotCreater {
    public static async createBlotFromFiles(
        files: File[],
        quill: Quill,
        blotName: string,
        options: Options = defaultOptions,
        createMethod?: FILE_CREATE_METHOD
    ) {
        return new FileBlotCreater(
            files,
            quill,
            blotName,
            options,
            createMethod
        ).createBlotFromFiles()
    }

    constructor(
        private files: File[],
        private quill: Quill,
        private blotName: string,
        private options: Options = defaultOptions,
        private createMethod: FILE_CREATE_METHOD = FILE_CREATE_METHOD.other
    ) {}

    async createBlotFromFiles() {
        const reduceFn = (result: FileTasks, file: File): FileTasks => {
            const { allowedTypesRegExp } = this.options
            if (
                allowedTypesRegExp == null ||
                file.type.match(allowedTypesRegExp)
            ) {
                result.push(this.createFileTask(file))
            }

            return result
        }

        const {
            user: { userId, teamId, email },
            currentDocument: { id }
        } = store.getState()

        this.files.forEach((file) => {
            const analytics = new EmbedAddAnalytics()

            switch (this.createMethod) {
                case FILE_CREATE_METHOD.fileDrop:
                    analytics.viaDragDrop()
                    break
                case FILE_CREATE_METHOD.plusButton:
                    analytics.viaPlusButton()
                    break
                case FILE_CREATE_METHOD.paste:
                    analytics.viaPaste()
                    break
                default:
            }

            analytics
                .isFile()
                .fileType(getEmbedType(file.type, file.name) as FILE_TYPES)
                .withProperties({
                    userId,
                    teamId,
                    email,
                    documentId: id
                })
                .track()
        })

        const tasks = this.files.reduce(reduceFn, [])

        await this.processFileTasks(tasks)
    }

    readFile(file: File | null) {
        return new Promise((resolve: { (dataUrl?: string): void }, reject) => {
            if (file == null) {
                resolve()
            }

            const reader = new FileReader()
            reader.onload = () => {
                resolve(reader.result as string)
            }

            reader.onerror = () => {
                resolve()
            }

            if (file instanceof Blob) {
                reader.readAsDataURL(file)
            }
        })
    }

    async createFileTask(file: File): Promise<[File, BlockEmbed] | void> {
        let embedOptions
        if (typeof this.options.getEmbedOptions === 'function') {
            embedOptions = this.options.getEmbedOptions(file)
        } else if (this.options.embedOptions != null) {
            embedOptions = this.options.embedOptions
        } else {
            embedOptions = {}
        }

        if (embedOptions.dataUrl) {
            const dataUrl = await this.readFile(file)
            if (dataUrl) {
                embedOptions.dataUrl = undefined
                return [file, this.insertFile(embedOptions, dataUrl)]
            }
        } else {
            return [file, this.insertFile(embedOptions)]
        }
    }

    getIndex(): number {
        const selection = this.quill.getSelection(true)
        const [selectedLine, offset] = this.quill.getLine(selection.index)
        const selectedLineLength = selectedLine.length()
        if (selectedLineLength === 1) {
            return selection.index
        } else {
            return selection.index - offset + selectedLineLength
        }
    }

    insertFile(embedOptions: any, dataUrl?: string): BlockEmbed {
        let { index } = this.options
        if (index == null) {
            index = this.getIndex()
        }

        this.quill.setSelection(index - 1, 0, QuillSources.SILENT)
        this.quill.insertEmbed(
            index,
            this.blotName,
            embedOptions,
            QuillSources.USER
        )
        PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)
        this.quill.setSelection(index, 0, QuillSources.SILENT)

        const [fileBlot] = this.quill.getLeaf(index)

        if (dataUrl) {
            const provider = fileBlot.provider
            if (typeof provider.setDataUrl === 'function') {
                provider.setDataUrl(dataUrl)
            }
        }

        return fileBlot
    }

    async processFileTasks(tasks: FileTasks) {
        const results = await Promise.all(tasks)
        const filesToUpload: File[] = []
        const fileBlotsIds: string[] = []

        for (let i = 0, len = results.length; i < len; i++) {
            const result = results[i]
            if (result != null) {
                const [file, fileBlot] = result
                filesToUpload.push(file)
                fileBlotsIds.push(fileBlot.domNode.id)
            }
        }

        if (filesToUpload.length > 0) {
            const assets = await UploadManager.uploadFiles(filesToUpload)
            if (assets) {
                store.dispatch(setAssets(assets))
                for (let i = 0, len = assets.length; i < len; i++) {
                    const asset = assets[i]
                    const fileBlotId = fileBlotsIds[i]
                    const fileBlotDomNode = document.getElementById(fileBlotId)
                    if (fileBlotDomNode != null) {
                        const fileBlot = Parchment.find(fileBlotDomNode)
                        if (fileBlot != null) {
                            const provider = fileBlot.provider
                            if (
                                typeof provider.setEmbedDataValue === 'function'
                            ) {
                                provider.setEmbedDataValue('id', asset.id)
                            }
                        }
                    }
                }
            }
        }
    }
}
