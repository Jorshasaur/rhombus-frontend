declare namespace Express {
    export interface Request {
        invision?: {
            user?: {
                userId: number,
                companyId: number,
                teamId: string,
                sessionId: string,
                name: string,
                email: string
            }
        }
    }
}