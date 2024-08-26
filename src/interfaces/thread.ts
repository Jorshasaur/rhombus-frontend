import { Comment } from './comment'

export interface Thread {
    id: string
    index?: number
    length?: number
    status: string
    comments: Comment[]
    resolved: boolean
    startedAt: Date
    height?: number
    markId: string
}
