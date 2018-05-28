const fs = require('fs')
const path = require('path')
const bncode = require('bncode')
const tmp = path.join(process.cwd(), 'tmp')

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

  if (!fs.existsSync(tmp)){
      fs.mkdirSync(tmp);
  }

  fs.writeFileSync(path.join(tmp, info.name + '.torrent'), metadata)
  output(info)
}

module.exports = save
