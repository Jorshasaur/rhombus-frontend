'use strict'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
    throw err
})

// Ensure environment variables are read.
process.env.ENVIRONMENT = 'test'
require('react-scripts-and-dip/config/env.js')

const jest = require('jest')
const argv = process.argv.slice(2)

jest.run(argv)
