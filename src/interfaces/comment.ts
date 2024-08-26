export interface Comment {
    id: string
    createdAt: Date
    userId: string
    comment: string
    updatedAt: Date
    hasError?: boolean
}
