import { Request, Response, RequestHandler, NextFunction } from 'express'
import { LaunchDarklyHelper } from '../util/LaunchDarklyHelper'
import { Logger } from '../util/Logger'
const logger = new Logger(__filename)
const ldHelper = LaunchDarklyHelper.getInstance()

const LaunchDarkly: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    if (req.invision && req.invision.user && req.invision.user.email) {
        const hasAccess = await ldHelper.getFeatureFlagByUserAndTeamId(
            LaunchDarklyHelper.HAS_ACCESS,
            req.invision.user.email,
            req.invision.user.teamId
        )
        if (hasAccess) {
            next()
            // Return here isn't strictly necessary but I had problems with TS without it
            return
        } else {
            logger.debug(
                `Rejecting userId ${req.invision.user.userId}, teamId ${
                    req.invision.user.teamId
                } because they arent enabled in the ${
                    LaunchDarklyHelper.HAS_ACCESS
                } feature flag`
            )
        }
    } else {
        logger.debug(
            `Rejecting user because they are invalid and cant be enabled in the ${
                LaunchDarklyHelper.HAS_ACCESS
            } feature flag`
        )
    }
    // 401 might be better but this is causing a problem with the Edge trying to redirect to login
    return res
        .status(404)
        .send({ message: 'The resource requested is not available.' })
}

export default LaunchDarkly
