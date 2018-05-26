const fs = require('fs')
const net = require('net')
const hat = require('hat')
const path = require('path')
const parseTorrent = require('parse-torrent')
const Discovery = require('torrent-discovery')
const Protocol = require('bittorrent-protocol')
const ut_metadata = require('ut_metadata')

const torrent = parseTorrent('magnet:?xt=urn:btih:' + process.argv[2])
const peerId = Buffer.from('-TR1330-' + hat(48))

const MAX = 100
let peers = []
let queue = {}
let count = 0

const discovery = new Discovery({
  infoHash: torrent.infoHashBuffer,
  peerId,
  dht: true,
  tracker: false,
  port: 6881,
  announce: []
})

discovery.on('peer', peer => {
  console.log('++peer++')

  if (!peers.includes(peer)) {
    peers.push(peer)
  }

  if (peers.length >= MAX) {
    discovery.destroy()

    for (let i=0; i<10; i++) {
      getMetadata()
    }
  }
})

let done = false
function save(metadata) {
  const target = path.join(__dirname, 'storage', torrent.infoHash + '.torrent')
  fs.writeFile(target, metadata, err => {
    if (err) throw err
    console.log(target)
  })
}

function getMetadata() {
  console.log('peer', peers.length, count)

  const peer = peers[count++]
  const parts = peer.split(':')
  const socket = net.connect(parts[1], parts[0])
  socket.id = peer
  queue[peer] = { socket }

  socket.setTimeout(5000, () => socket.destroy());
  socket.on('connect', () => {
    socket.setTimeout(0)

    const wire = new Protocol()
    queue[socket.id].wire = wire

    wire.use(ut_metadata())
    wire.ut_metadata.fetch()
    wire.ut_metadata.on('metadata', metadata => {
      console.log('++ metadata ++')

      done = true
      peers = []
      save(metadata)

      for (let key in queue) {
        console.log('+++++ force +++++', key)
        if (queue[key].wire) {
          queue[key].wire.destroy()
        }
        queue[key].socket.destroy()
      }
    })

    wire.handshake(torrent.infoHashBuffer, peerId)
    socket.pipe(wire).pipe(socket)
  });

  socket.on('timeout', () => socket.destroy())
  socket.on('end', () => socket.destroy())
  socket.on('error', () => socket.destroy())
  socket.on('close', () => {
    if (queue[socket.id].wire) {
      queue[socket.id].wire.destroy()
    }
    delete queue[socket.id]
    const queueLen = Object.keys(queue).length
    // console.log('++ closed ++', peer, 'count', count, 'queue', queueLen, 'peers', peers.length)

    if (!done && count < peers.length) {
      getMetadata()
    }

    if (queueLen === 0) {
      console.log('end')
      process.exit()
    }
  })
}
