declare namespace Express {
    export interface Request {
        invision?: {
            user?: {
                userId: number,
                companyId: number,
                teamId: number,
                sessionId: string,
                name: string,
                email: string
            }
        }
    }
}