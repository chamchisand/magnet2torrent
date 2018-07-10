const hat = require('hat')
const parseTorrent = require('parse-torrent')
const Discovery = require('torrent-discovery')
const magnetLink = require('./lib/magnet-link')
const PeerPool = require('./lib/peer-pool')
const log = require('./lib/log')

process.on('uncaughtException', err => {
  log.error(err)
  process.exit()
});

const peerId = Buffer.from('-TR1330-' + hat(48))
const magnet = magnetLink(process.argv[2])
const torrent = parseTorrent(magnet)
log.debug('[torrent]', torrent)

const MAX = 100
let peerNotFound = setTimeout(() => {
  log.debug('[peer] notfound')
  process.exit()
}, 5000)

const pool = new PeerPool(torrent.infoHashBuffer, peerId)
const discovery = new Discovery({
  infoHash: torrent.infoHashBuffer,
  peerId,
  dht: true,
  tracker: false,
  port: 6881,
  announce: []
})

discovery.on('peer', peer => {
  log.debug('[peer]', peer)

  if (pool.push(peer)) {
    pool.connect()
  }

  if (peerNotFound) {
    clearTimeout(peerNotFound)
    peerNotFound = null
  }

  if (pool.len() >= MAX) {
    discovery.destroy()
  }
})
