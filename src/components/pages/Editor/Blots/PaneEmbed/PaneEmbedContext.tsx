import { createContext } from 'react'
import { BlotSize } from '../../../../../interfaces/blotSize'
import { PaneEmbedProvider } from './PaneEmbedProvider'

export const defaultPaneState = {
    uuid: '',
    version: 1,
    authorId: '',
    embedData: {},
    canEdit: false,
    size: BlotSize.Medium,
    hasOpenThread: false,
    unviewable: false
}

export interface PaneEmbedContext {
    uuid: string
    version: number
    authorId: string
    embedData: any
    hasOpenThread?: boolean
    createdAt?: string
    canEdit?: boolean
    size?: BlotSize
    pane?: string
    setState?: typeof PaneEmbedProvider.prototype.setState
    selectBlot?: typeof PaneEmbedProvider.prototype.selectBlot
    setEmbedDataValue?: typeof PaneEmbedProvider.prototype.setEmbedDataValue
    unviewable: boolean
}

export const PaneEmbedContext = createContext<PaneEmbedContext>(
    defaultPaneState
)
