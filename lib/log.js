const os = require('os')
const fs = require('fs')
const path = require('path')
const pad = require('./pad')

const WRITETOLOG = false
const INFOHASH = process.argv[2]
let DEBUG = ['-d', '--debug'].includes(process.argv[3])
if (WRITETOLOG) {
  DEBUG = true
}

class Log {
  constructor() {
    const dir = path.join(__dirname, '../logs')
    const now = new Date()
    const ymd = now.getFullYear()
      + pad(now.getMonth() + 1)
      + pad(now.getDate())

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    this.log = path.join(dir, `${ymd}.log`)
  }

  write(msg) {
      const now = (new Date).toISOString()
      fs.appendFileSync(this.log, `${now} ${INFOHASH} "${msg}"${os.EOL}`)
  }

  debug(...args) {
    if (!DEBUG) return

    const msg = args.map(arg => {
      return typeof arg === 'object'
        ? JSON.stringify(arg)
        : arg
    }).join(' ')

    if (WRITETOLOG) {
      this.write(msg)
    } else {
      console.log(msg)
    }
  }

  error(err) {
    const msg = `${err.toString()}\n${err.stack}`
    this.write(msg)
  }
}

module.exports = new Log()
