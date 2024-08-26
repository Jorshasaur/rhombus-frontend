import { v4 as uuid } from 'uuid'
import Quill from '../entries/Editor'
import { ImageTypeRegExp, VideoTypeRegExp } from './FileTypeConstants'
import { BlotSize } from '../../../interfaces/blotSize'

export default function getFileEmbedOptions(file: File, quill: Quill) {
    const embedOptions: any = {
        version: 1,
        service: 'file',
        uuid: uuid(),
        authorId: quill.getModule('authorship').options.authorId,
        createdAt: new Date()
    }

    if (file.type.match(ImageTypeRegExp)) {
        embedOptions.service = 'image'
        embedOptions.dataUrl = true
        embedOptions.embedData = {}
    } else if (file.type.match(VideoTypeRegExp)) {
        embedOptions.service = 'video'
        embedOptions.size = BlotSize.Medium
        embedOptions.embedData = {
            fileName: file.name
        }
    } else {
        embedOptions.embedData = {
            fileName: file.name
        }
    }

    return embedOptions
}
