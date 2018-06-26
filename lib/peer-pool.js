const save = require('./save')
const Peer = require('./peer')
const log = require('./log')
const MAXCONN = 10

class PeerPool {
  constructor(infoHash, myPeerId) {
    this.infoHash = infoHash
    this.myPeerId = myPeerId
    this.uniqPeers = []
    this.peers = []
    this.conns = []
    this.metadata = null
    this.wait = null
  }

  push(peer) {
    if (this.uniqPeers.includes(peer)) {
      return false
    }

    this.uniqPeers.push(peer)
    this.peers.push(peer)
    return true
  }

  pop() {
    return this.peers.pop()
  }

  len() {
    return this.peers.length
  }

  connect() {
    if (this.wait) {
      log.debug('[pool] clear timeout')
      clearTimeout(this.wait)
      this.wait = null
    }

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

      if (!this.metadata) {
        this.metadata = metadata
        save(metadata)
      }
    })

    peer.on('close', id => {
      this.conns = this.conns.filter(conn => conn.id !== id)
      log.debug('[pool][close] conns=', this.conns.length, 'peers=', this.peers.length)

      if (this.peers.length > 0) {
        this.connect()
      }

      if (this.conns.length === 0) {
        let delay = this.metadata ? 0 : 5000
        log.debug('[pool][exit] delay:' + delay)
        this.wait = setTimeout(() => process.exit(), delay)
      }
    })
  }
}

module.exports = PeerPool
