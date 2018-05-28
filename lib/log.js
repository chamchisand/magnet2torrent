const DEBUG = ['-d', '--debug'].includes(process.argv[3])

module.exports = (...args) => {
  if (DEBUG) {
    args = args.map(arg => {
      return typeof arg === 'object'
        ? JSON.stringify(arg)
        : arg
    })
    console.log(args.join(' '))
  }
}
