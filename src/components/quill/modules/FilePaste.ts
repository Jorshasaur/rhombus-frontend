import Quill from '../entries/Editor'
import { v4 as uuid } from 'uuid'
import setImmediatePromise from 'set-immediate-promise'
import FileBlotCreater from './FileBlotCreator'
import { ImageTypeRegExp } from './FileTypeConstants'
import { FILE_CREATE_METHOD } from '../../../helpers/EmbedHelper'
import { BLOCK_EMBED_BLOT_NAME } from '../../../constants/embeds'

export default class FilePasteModule {
    constructor(private quill: Quill, enabled: boolean) {
        if (enabled) {
            this.handlePaste = this.handlePaste.bind(this)

            this.quill.root.addEventListener('paste', this.handlePaste)
        }
    }

    async waitUntilSelectionIsReady() {
        await setImmediatePromise() // wait until paste is done
        if (this.quill.getSelection() == null) {
            this.waitUntilSelectionIsReady()
        }
    }

    async handlePaste(e: ClipboardEvent) {
        if (e.clipboardData == null) {
            return
        }

        const { items } = e.clipboardData

        if (items != null) {
            // Chrome, Firefox or any other browsers with DataTransfer.items implemented
            const files = []

            for (let i = 0, len = items.length; i < len; i++) {
                const item = items[i]
                const file = item.getAsFile()
                if (file != null) {
                    files.push(file)
                }
            }

            if (files.length > 0) {
                e.preventDefault()
            }

            const embedOptions = {
                version: 1,
                service: 'image',
                dataUrl: true,
                uuid: uuid(),
                authorId: this.quill.getModule('authorship').options.authorId,
                createdAt: new Date(),
                embedData: {}
            }

            await this.waitUntilSelectionIsReady()

            await FileBlotCreater.createBlotFromFiles(
                files,
                this.quill,
                BLOCK_EMBED_BLOT_NAME,
                { allowedTypesRegExp: ImageTypeRegExp, embedOptions },
                FILE_CREATE_METHOD.paste
            )
        }
    }
}
