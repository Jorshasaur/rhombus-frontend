import * as joi from 'joi'
import {Request, Response, RequestHandler, NextFunction} from 'express'
const isJson = require('is-json')

const EDGE_HEADER_SCHEMA = joi.object({
    user_id: joi.number().integer().min(1),
    company_id: joi.number().integer(),
    team_id: joi.string().min(1),
    session_id: joi.string().min(1),
    name: joi.string().min(1),
    email: joi.string().email()
})

let EdgeContext: RequestHandler = function (req: Request, res: Response, next: NextFunction): void | Response {
    if (req.originalUrl === '/healthcheck') {
        return next()
    }

    const [invisionUser, err] = parseEdgeContext(req)

    if (err) {
        // req.log.error({err: err, headers: req.headers}, 'Invalid invision-edge-context header')
        return res.status(400).send({message: 'Invalid Context Headers'})
    }

    if (!invisionUser) {
        req.invision = Object.assign({}, req.invision || {}, {
            user: null
        })
    } else {
        req.invision = Object.assign({}, req.invision || {}, {
            user: {
                userId: `${invisionUser.user_id}`, //used to make a string from the number that represents the user id
                teamId: invisionUser.team_id,
                sessionId: invisionUser.session_id,
                name: invisionUser.name,
                email: invisionUser.email
            }
        })

        if (req.invision.user && invisionUser.company_id !== -1 && invisionUser.company_id !== 1) {
            req.invision.user.companyId = invisionUser.company_id;
        }
    }

    next()
}

function parseEdgeContext(req: Request) {
    const headerValue = req.get('invision-edge-context') || ''
    const edgeHeader = Buffer.from(headerValue, 'base64').toString().replace(/[\u0000-\u0019]+/g, "")

    if (!isJson(edgeHeader)) {
        return [null, 'Invalid SessionData header']
    }

    const schemaValidation = joi.validate(edgeHeader, EDGE_HEADER_SCHEMA)

    if (schemaValidation.error !== null) {
        return [null, 'Invalid Session object']
    }

    return [schemaValidation.value as any, null]
}

export default EdgeContext