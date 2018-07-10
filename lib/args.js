const argv = process.argv.slice(3)
const parsed = {}

for (let val of argv) {
  let splits = val.split('=')
  parsed[splits[0]] = splits[1] || ''
}

module.exports = function(opt) {
  if (Array.isArray(opt)) {
    opt = opt.find(name => (name in parsed))
  }

  if (!(opt in parsed)) {
    return false
  }

  return parsed[opt] || ''
}
