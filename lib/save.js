const fs = require('fs')
const path = require('path')
const bncode = require('bncode')
const args = require('./args')

let TMP = args('--tmp-dir')
if (!TMP) {
  TMP = path.join(__dirname, '../tmp')
}

const output = ({ name, length, files }) => {
  files = files || []

  if (files.length === 0) {
    files.push({ length, path: name })
  }

  files = files.map(file => ({
    ...file,
    path: file.path.toString()
  }))

  console.log(JSON.stringify({ name, files }))
}

const save = (metadata) => {
  const decoded = bncode.decode(metadata)
  const info = decoded.info || {}
  info.name = info.name.toString()

  if (!fs.existsSync(TMP)){
    fs.mkdirSync(TMP);
  }

  fs.writeFileSync(path.join(TMP, info.name + '.torrent'), metadata)
  output(info)
}

module.exports = save
