const os = require('os')
const fs = require('fs')
const path = require('path')
const pad = require('./pad')
const args = require('./args')

class Log {
  constructor() {
    const now = new Date()
    const ymd = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate())
    const logdir = args('--log-dir') || path.join(__dirname, '../logs')

    if (!fs.existsSync(logdir)){
      fs.mkdirSync(logdir);
    }

    this.log = path.join(logdir, `${ymd}.log`)
    this.debugMode = args(['-d', '--debug'])
    this.infoHash = process.argv[2]
  }

  write(msg) {
    const now = (new Date).toISOString()
    fs.appendFileSync(this.log, `${now} ${this.infoHash} "${msg}"${os.EOL}`)
  }

  debug(...args) {
    if (this.debugMode === false) return

    const msg = args.map(arg => {
      return typeof arg === 'object'
        ? JSON.stringify(arg)
        : arg
    }).join(' ')

    if (this.debugMode === 'file') {
      this.write(msg)
    } else {
      console.log(msg)
    }
  }

  error(err) {
    this.write(`${err.toString()}\n${err.stack}`)
  }
}

module.exports = new Log()
