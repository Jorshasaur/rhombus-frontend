const postcss = require('postcss')
const cssnano = require('cssnano')
const fs = require('fs')
const base64 = require('postcss-base64')
const modules = require('postcss-modules')
const glob = require('glob')
const jsesc = require('jsesc')
const imageInliner = require('postcss-image-inliner')

const splitPath = function (path) {
    var result = path
        .replace(/\\/g, '/')
        .match(/(.*\/)?(\..*?|.*?)(\.[^.]*?)?(#.*$|\?.*$|$)/)
    return {
        path: result[1] || '',
        name: result[2] + result[3],
    }
}

function processFile(filePath) {
    return new Promise((resolve) => {
        const file = splitPath(filePath)
        fs.readFile(file.path + file.name, (_err, css) => {
            postcss([
                modules({
                    root: file.path,
                    generateScopedName: '[local]',
                }),
                imageInliner({
                    assetPaths: ['https:/invisionapp-cdn.com/']
                }),
                base64({
                    root: file.path,
                    excludeAtFontFace: false,
                    extensions: ['.ttf', '.otf', '.woff', '.svg', '.png'],
                }),
                cssnano,
            ])
                .process(css, {
                    from: undefined
                })
                .then((result) => {
                    resolve(result)
                })
        })
    })
}

async function generateStyles(files) {
    return new Promise(async (resolve) => {
        const styles = await Promise.all(files.map((file) => processFile(file)))
        const combinedStyles = styles.join(' ')
        resolve(combinedStyles)
    })
}

glob('./src/**/*.css', {
    ignore: ['DarkMode.module.css']
}, async function (_error, files) {
    const generatedStyles = await generateStyles(files)
    const emailStyles = await generateStyles(['./scripts/build-thumbnail-styles/styles/email-styles.css'])
    const overrideStyles = await generateStyles(['./scripts/build-thumbnail-styles/styles/overrides.css'])
    const combinedStyles = generatedStyles + emailStyles + overrideStyles
    const styleString = `export const styles = \`${combinedStyles} #quill-container{width:912px;margin:155px auto 0;}\``
    const escapeString = jsesc(styleString, {
        es6: true
    })
    fs.writeFile('./build/styles.ts', escapeString, () => true)

    // Cleanup. PostCSS is generating an undefined.json file in the root and I'm not sure why.
    if (fs.existsSync('./undefined.json')) {
        fs.unlinkSync('./undefined.json')
    }
})
