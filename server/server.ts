import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as http from 'http'
import * as ejs from 'ejs'
import { long as gitLong } from 'git-rev-sync'
import fetch from 'node-fetch'

import { Logger } from './util/Logger'
import { isOnBeta } from './util/environmentHelpers'

// Middleware
import EdgeContext from './middleware/EdgeContext'
import LaunchDarkly from './middleware/LaunchDarkly'
import NoCache from './middleware/NoCache'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginExpress from '@bugsnag/plugin-express'

// Top Level Controllers/Routes
import HealthcheckController from './controllers/HealthcheckController'
import { DOCUMENT_REGEX } from './constants'

const GITHASH = gitLong()
const bugsnagClient = Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY || '',
    appType: 'server',
    plugins: [BugsnagPluginExpress],
    appVersion: GITHASH,
    releaseStage: process.env.METADATA_TYPE,
    metadata: { cluster: process.env.METADATA_NAME }
})

function handleIndex(req: express.Request, res: express.Response) {
    const { overrideSha } = req.query
    if (isOnBeta(process.env.METADATA_TYPE) && overrideSha) {
        if (overrideSha === 'dev') {
            fetch('http://localhost:3000/index.html')
                .then((html) => html.text())
                .then((html) => res.send(html))
        } else {
            fetch(
                `https://s3.amazonaws.com/pages-ui-build-assets/index.${overrideSha}.html`
            )
                .then((html) => html.text())
                .then((html) => res.send(html))
        }
    } else {
        res.render('build/index.html', {
            METADATA_TYPE: process.env.METADATA_TYPE,
            METADATA_NAME: process.env.METADATA_NAME,
            BUGSNAG_API_KEY: process.env.BUGSNAG_API_KEY,
            GITHASH,
            NEWRELIC_BROWSER_LICENSE_KEY:
                process.env.NEWRELIC_BROWSER_LICENSE_KEY,
            NEWRELIC_BROWSER_APPLICATION_ID:
                process.env.NEWRELIC_BROWSER_APPLICATION_ID
        })
    }
}

export class Server {
    public static readonly PORT: number = 8080
    public express: express.Application
    private server: http.Server
    private port: string | number
    private isEnabled: boolean
    private logger: Logger

    constructor() {
        this.logger = new Logger(__filename)
        this.createApp()
        this.config()
        this.createServer()
        this.middleware()
        this.routes()
        this.listen()
    }

    public gracefulShutdown() {
        this.logger.debug('Stopping the server gracefully')
        this.server.close()
    }

    private createApp(): void {
        this.express = express()
    }

    private createServer(): void {
        this.server = http.createServer(this.express)
    }

    private config(): void {
        this.port = process.env.PORT || Server.PORT
        this.isEnabled =
            process.env.METADATA_NAME === 'local' ||
            process.env.METADATA_NAME ===
                'use1-test-4-integration-v7-cluster' ||
            process.env.METADATA_NAME === 'use1-prev-1-v7-cluster' ||
            process.env.METADATA_NAME === 'use1-prod-1-v7-cluster'
    }

    private middleware(): void {
        const bugsnagMiddleware = bugsnagClient.getPlugin('express')!
        // This must be the first piece of middleware in the stack.
        // It can only capture errors in downstream middleware
        this.express.use(bugsnagMiddleware.requestHandler)
        this.express.use(bodyParser.json())
        this.express.use(bodyParser.urlencoded({ extended: false }))
        this.express.use(EdgeContext)
        this.express.set('views', __dirname + '/..')
        this.express.set('view engine', 'ejs')
        this.express.engine('html', ejs.renderFile)
        // This handles any errors that Express catches
        this.express.use(bugsnagMiddleware.errorHandler)
    }

    private routes(): void {
        if (this.isEnabled) {
            this.express.use(DOCUMENT_REGEX, [
                LaunchDarkly,
                NoCache,
                handleIndex
            ])
            this.express.use('/rhombus/create', [
                LaunchDarkly,
                NoCache,
                handleIndex
            ])
            this.express.get('/rhombus/', [LaunchDarkly, NoCache, handleIndex])
            this.express.use('/rhombus', [
                LaunchDarkly,
                express.static('build')
            ])
        }
        this.express.use('/healthcheck', [NoCache, HealthcheckController])
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            this.logger.debug(`Running server on port ${this.port}`)
        })
    }
}
