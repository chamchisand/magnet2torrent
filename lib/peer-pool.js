const save = require('./save')
const Peer = require('./peer')
const log = require('./log')
const MAXCONN = 10

class PeerPool {
  constructor(infoHash, myPeerId) {
    this.infoHash = infoHash
    this.myPeerId = myPeerId
    this.peers = []
    this.conns = []
  }

  push(peer) {
    this.peers.push(peer)
  }

  pop() {
    return this.peers.pop()
  }

  len() {
    return this.peers.length
  }

  connect() {
    if (this.conns.length >= MAXCONN) {
      log.debug('[pool] max connection reached')
      return
    }

    if (this.peers.length === 0) {
      log.debug('[pool] no peer found')
      return
    }

    const addr = this.pop()
    const peer = new Peer(addr, this.infoHash, this.myPeerId)
    const conn = peer.connect()
    this.conns.push(conn)

    peer.on('metadata', metadata => {
      log.debug('[pool][metadata] clear peers')
      this.peers = []

      for (let conn of this.conns) {
        if (conn.wire) {
          conn.wire.destroy()
        }
        conn.socket.destroy()
      }

      save(metadata)
    })
    peer.on('close', id => {
      this.conns = this.conns.filter(conn => conn.id !== id)
      log.debug('[pool][close] queues=', this.conns.length, 'peers=', this.peers.length)

      if (this.peers.length > 0) {
        this.connect()
      }

      if (this.conns.length === 0) {
        log.debug('[exit]')
        process.exit()
      }
    })
  }
}

module.exports = PeerPool
