import {Router, Request, Response} from 'express'
import {wrap as asyncify} from 'async-middleware'

export class HealthcheckController {
    router: Router

    constructor(){
        this.router = Router()
        this.init()
    }

    public async GetHealthcheck(req: Request, res: Response) {
        if (req.query.error) {
            throw new Error("Nope")
        }
            
        res.status(200).send({
            status: res.status,
            healthy: true
        })
    }

    init() {
        this.router.get("/", asyncify(this.GetHealthcheck))
    }
}

const healthcheckController = new HealthcheckController()
healthcheckController.init()

export default healthcheckController.router