const os = require('os')
const fs = require('fs')
const path = require('path')
const pad = require('./pad')

const INFOHASH = process.argv[2]
const DEBUGMODE = ['-d', '--debug'].includes(process.argv[3])

class Log {
  debug(...args) {
    if (!DEBUGMODE) return

    args = args.map(arg => {
      return typeof arg === 'object'
        ? JSON.stringify(arg)
        : arg
    })
    console.log(args.join(' '))
  }

  error(err) {
    const dir = path.join(__dirname, '../logs')
    const now = new Date()
    const iso = now.toISOString()
    const ymd = now.getFullYear()
      + pad(now.getMonth() + 1)
      + pad(now.getDate())

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const logpath = path.join(dir, `error-${ymd}.log`)
    const msg = `${iso} ${INFOHASH} "${err.toString()}" "${err.stack}"${os.EOL}`
    fs.appendFileSync(logpath, msg)

    if (DEBUGMODE) {
      console.log(err)
    }
  }
}

module.exports = new Log()
