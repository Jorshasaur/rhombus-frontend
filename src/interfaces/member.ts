export interface Member {
    id: number
    userId: number
    teamId: number
    name: string
    email: string
    avatarId: string
    avatarUrl: string
    lastViewed: Date
    isViewing?: boolean
    isDefaultAvatar: boolean
}
