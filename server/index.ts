import { LaunchDarklyHelper } from './util/LaunchDarklyHelper'
import { Logger } from './util/Logger'
import { Server } from './server'
const ldHelper = LaunchDarklyHelper.getInstance()
const logger = new Logger(__filename)

let server: Server

const init = async () => {
    await ldHelper.onReady()
    server = new Server()
}

process.on('uncaughtException', (err) => {
    logger.fatal(`Uncaught Exception: ${err}`)
    setTimeout(() => {
        process.exit(1)
    }, 100)
})

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal(`Unhandled Rejection: ${reason}`)
    setTimeout(() => {
        process.exit(1)
    }, 100)
})

const shutdown = () => {
    if (server) {
        server.gracefulShutdown()
    }
}

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)

init()
