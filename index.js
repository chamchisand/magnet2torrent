const fs = require('fs')
const net = require('net')
const hat = require('hat')
const path = require('path')
const bncode = require('bncode')
const parseTorrent = require('parse-torrent')
const Discovery = require('torrent-discovery')
const Protocol = require('bittorrent-protocol')
const ut_metadata = require('ut_metadata')

let infohash = process.argv[2]

if (!/^magnet:/.test(infohash)) {
  infohash = 'magnet:?xt=urn:btih:' + infohash
}

const torrent = parseTorrent(infohash)
const peerId = Buffer.from('-TR1330-' + hat(48))
// console.log(torrent)

const MAXPEER = 100
const MAXCONN = 10

let peers = []
let queue = {}
let count = 0
let noPeerFound = setTimeout(() => {
  process.exit()
}, 5000)

const discovery = new Discovery({
  infoHash: torrent.infoHashBuffer,
  peerId,
  dht: true,
  tracker: false,
  port: 6881,
  announce: []
})

discovery.on('peer', peer => {
  peers.push(peer)

  if (noPeerFound) {
    clearTimeout(noPeerFound)
    noPeerFound = null
  }

  if (peers.length >= MAXPEER) {
    discovery.destroy()
  }

  if (count < MAXCONN) {
    getMetadata()
  }
})

function save(metadata) {
  const decoded = bncode.decode(metadata)
  const info = decoded.info || {}
  const name = info.name.toString()
  const length = info.length
  const files = (info.files || []).map(file => {
    return { ...file, path: file.path.toString() };
  })

  const target = path.join(__dirname, 'storage', name + '.torrent')
  fs.writeFileSync(target, metadata)
  console.log(JSON.stringify({ name, length, files }))
}

function getMetadata() {
  const peer = peers.pop()
  const parts = peer.split(':')
  const socket = net.connect(parts[1], parts[0])
  const wire = new Protocol()

  // console.log('connect - peer', peer, 'peerlen', peers.length, 'count', ++count)
  socket.id = peer
  queue[peer] = { socket, wire }

  wire.use(ut_metadata())
  wire.ut_metadata.fetch()
  wire.ut_metadata.on('metadata', metadata => {
    // console.log('++ metadata ++')
    peers = []

    for (let key in queue) {
      if (queue[key].wire) {
        queue[key].wire.destroy()
      }
      queue[key].socket.destroy()
    }

    save(metadata)
  })

  socket.setTimeout(2000, () => socket.destroy());
  socket.on('connect', () => {
    socket.setTimeout(0)
    wire.handshake(torrent.infoHashBuffer, peerId)
    socket.pipe(wire).pipe(socket)
  });

  socket.on('timeout', () => socket.destroy())
  socket.on('end', () => socket.destroy())
  socket.on('error', () => socket.destroy())
  socket.on('close', () => {
    if (queue[socket.id] && queue[socket.id].wire) {
      queue[socket.id].wire.destroy()
    }
    delete queue[socket.id]
    const queueLen = Object.keys(queue).length
    // console.log('++ closed ++', peer, 'count', count, 'queue', queueLen, 'peers', peers.length)

    if (peers.length > 0) {
      getMetadata()
    }

    if (queueLen === 0) {
      process.exit()
    }
  })
}
