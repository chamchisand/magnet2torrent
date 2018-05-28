
const magnetLink = (infohash) => {
  if (infohash.length !== 40) {
    throw new Error('Invalid infohash')
  }

  if (!/^magnet:/.test(infohash)) {
    infohash = 'magnet:?xt=urn:btih:' + infohash
  }

  return infohash
}

module.exports = magnetLink
