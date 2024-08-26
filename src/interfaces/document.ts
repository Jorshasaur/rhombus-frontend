export interface Document {
    archivedAt?: Date
    createdAt: Date
    id: string
    isArchived: boolean
    ownerId: number
    teamId: string
    title: string
    updatedAt: Date
    url: string
}
