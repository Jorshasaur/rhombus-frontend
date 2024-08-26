import FileEmbed from '../components/pages/Editor/Blots/FileEmbed'
import DefaultEmbedTypes from '../components/quill/blots/DefaultEmbedTypes'
import { BlotSize } from './blotSize'

export type BlockEmbedService =
    | keyof typeof DefaultEmbedTypes
    | ReturnType<FileEmbed['_getFileTypeClass']>

export interface BlockEmbedValue {
    authorId: string
    createdAt: string
    dataUrl?: string
    embed?: any
    embedData: any
    originalLink?: string
    service: BlockEmbedService
    size?: BlotSize
    type?: string
    unviewable?: boolean
    uuid: string
    version: number
}

export interface BlockEmbedProps {
    authorId: string
    authorName?: string
    createdAt?: string
    embedData?: {}
    key: string
    originalLink?: string
    service: BlockEmbedService
    size?: BlotSize
    title?: string
    type?: string
    uuid?: string
    version?: number
}

export interface ResizableEmbed {
    _renderSmall: Function
    _renderFullSize: Function
    handleModalOpen: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
    handleModalClose: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
}
