const net = require('net')
const EventEmitter = require('events');
const Protocol = require('bittorrent-protocol')
const ut_metadata = require('ut_metadata')
const log = require('./log')

class Peer extends EventEmitter {
  constructor(addr, infoHash, myPeerId) {
    super()

    log.debug('[peer]', addr)
    this.id = Math.floor(Math.random() * 100000)
    this.addr = addr
    this.infoHash = infoHash
    this.myPeerId = myPeerId
  }

  connect() {
    const parts = this.addr.split(':')
    const socket = net.connect(parts[1], parts[0])
    const wire = new Protocol()

    wire.use(ut_metadata())
    wire.ut_metadata.fetch()
    wire.ut_metadata.on('metadata', metadata => {
      log.debug('[peer][metadata]', this.addr)
      this.emit('metadata', metadata)
    })

    socket.setTimeout(2000, () => socket.destroy());
    socket.on('connect', () => {
      socket.setTimeout(0)
      wire.handshake(this.infoHash, this.myPeerId)
      socket.pipe(wire).pipe(socket)
    });

    socket.on('timeout', () => socket.destroy())
    socket.on('end', () => socket.destroy())
    socket.on('error', () => socket.destroy())
    socket.on('close', () => {
      log.debug('[peer][close]', this.id, this.addr)
      this.emit('close', this.id)
    })

    return { id: this.id, socket, wire }
  }
}

module.exports = Peer
