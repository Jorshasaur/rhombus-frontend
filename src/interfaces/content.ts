import { ContentType } from './contentType'
import { Member } from './member'

export interface Text {
    type: ContentType.Text
    text: string
}

export interface Break {
    type: ContentType.Break
}

export interface DocumentMention {
    type: ContentType.DocumentMention
    token: string
}

export interface Mention {
    type: ContentType.Mention
    token: string
    userId: number
    user?: Member
}

export type Content = Text | Break | Mention | DocumentMention
