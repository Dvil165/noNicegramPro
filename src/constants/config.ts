import argv from 'minimist'
const options = argv(process.argv.splice(2))

export const isProduction = Boolean(options.production)
