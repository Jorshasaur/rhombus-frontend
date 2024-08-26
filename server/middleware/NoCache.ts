import { Request, Response, RequestHandler, NextFunction } from 'express'

const NoCache: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {    
    res.setHeader('Surrogate-Control', 'no-store')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    next()
}

export default NoCache