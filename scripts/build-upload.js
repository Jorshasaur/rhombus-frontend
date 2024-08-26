// Do this as the first thing so that any code reading it knows the right env.
process.env.ENVIRONMENT = 'build-upload'
require('react-scripts-and-dip/config/env.js')

const path = require('path')
const execa = require('execa')
const fs = require('fs-extra')
const printHostingInstructions = require('react-dev-utils/printHostingInstructions')
const printBuildError = require('react-dev-utils/printBuildError')

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

async function main() {
    try {
        const dir = resolveApp(process.env.OUTPUT_PATH)
        const hash = execa.commandSync('git rev-parse HEAD', { shell: true })
            .stdout

        process.env.REACT_APP_GITHASH = hash

        const cmd = execa('yarn', ['build'])
        cmd.stdout.pipe(process.stdout)
        await cmd

        await execa.command(`mv uploads/index.html uploads/index.${hash}.html`)
        await execa.command('rm -rf uploads/static', { shell: true })

        fs.copySync(dir, '/uploads')

        const appPackage = require(resolveApp('package.json'))
        const publicUrl = dir
        const publicPath = process.env.PUBLIC_URL
        const buildFolder = dir
        printHostingInstructions(
            appPackage,
            publicUrl,
            publicPath,
            buildFolder,
            true
        )
    } catch (error) {
        console.error('Failed to compile.\n')
        printBuildError(error)
        process.exit(1)
    }
}

main()
