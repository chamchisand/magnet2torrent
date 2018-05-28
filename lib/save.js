const fs = require('fs')
const path = require('path')
const bncode = require('bncode')

const save = (metadata) => {
  const decoded = bncode.decode(metadata)
  const info = decoded.info || {}
  const name = info.name.toString()
  let files = info.files || []

  if (files.length === 0) {
    files.push({ length: info.length, path: name })
  }

  files = files.map(file => ({
    ...file,
    path: file.path.toString()
  }))

  const target = path.join(process.cwd(), 'storage', name + '.torrent')
  fs.writeFileSync(target, metadata)
  console.log(JSON.stringify({ name, files }))
}

module.exports = save
