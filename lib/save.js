const fs = require('fs')
const path = require('path')
const bncode = require('bncode')
const tmp = path.join(process.cwd(), 'tmp')

const save = (metadata) => {
  const decoded = bncode.decode(metadata)
  const info = decoded.info || {}
  const name = info.name.toString()

  if (!fs.existsSync(tmp)){
      fs.mkdirSync(tmp);
  }
  fs.writeFileSync(path.join(tmp, name + '.torrent'), metadata)

  let files = info.files || []

  if (files.length === 0) {
    files.push({ length: info.length, path: name })
  }

  files = files.map(file => ({
    ...file,
    path: file.path.toString()
  }))

  console.log(JSON.stringify({ name, files }))
}

module.exports = save
