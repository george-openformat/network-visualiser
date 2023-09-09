import './style.css'
import p5 from "p5"

new p5(sketch)

/**
* This is a p5 sketch.
* @param {p5} p - The p5 instance.
*/



function sketch(p) {
  const gridSize = 15
  const amount = (innerWidth / gridSize) * (innerHeight / gridSize)
  console.log(amount)
  const nodes = addNodes(p, parseInt(amount * 0.1), gridSize)

  const green = p.color(255)
  const star = p.color('#39c463')
  const white = p.color(30)

  p.setup = () => {
    p.createCanvas(innerWidth, innerHeight)
    p.background(0)
    p.stroke(white)
    p.strokeWeight(3)
    p.smooth()
  }

  p.draw = () => {
    p.background(0)
    const mouse = p.createVector(p.mouseX, p.mouseY)
    p.stroke(white)
    for (let node of nodes) {
      const { x, y } = node.state.position
      p.strokeWeight(p.map(mouse.dist(node.state.position), 0, 250, 3, 2, true))
      const e = p.map(node.state.energy, 0, node.state.size, 0, 1)
      for (let { state: { position: c } } of node.getConnections()) {
        p.stroke(white)
        if (node.state.recentlyFired) {
          (node.getConnections()).length <= 5 ? p.stroke(star) : p.stroke(green)
        }
        p.line(x, y, c.x, c.y)

      }
    }
    for (let node of nodes) {
      const { x, y } = node.state.position
      const scaler = (p.map(mouse.dist(node.state.position), 0, 250, 0.6, 0.5, true))
      node.update(nodes)
      node.state.position.dist(mouse) < 50 ? node.trigger() : ""
      p.fill(white)
      p.noStroke()
      const s = scaler * node.state.size
      const s2 = (scaler * node.state.size) + (scaler * node.state.energy) * 0.2
      p.ellipse(x, y, s, s)
      if (node.state.energy > 0) {
        (node.getConnections()).length <= 5 ? p.fill(star) : p.fill(green)
        p.ellipse(x, y, s2, s2)
      }

    }
  }
}
// node
function createNode() {
  const id = uniqueId()
  const state = {
    size: 5,
    energy: 0,
    recentlyFired: false,
    position: new p5.Vector()
  }
  const connections = []

  const connect = (node) => {
    connections.push(node)
    state.size += 2
  }
  const disconnect = (id) => {
    const i = connections.findIndex(n => n.id === id)
    connections.splice(i, 1)
    state.size -= 1
  }

  const trigger = () => {
    state.energy < state.size && !state.recentlyFired ? state.energy += 5 : ""
  }

  const update = (nodes) => {
    state.energy > 0 ? state.energy -= 0.2 : ""
    state.energy < 5 ? state.recentlyFired = false : ""
    // fire
    if (state.energy >= state.size) {
      state.recentlyFired = true
      state.position.x += (Math.random() * 5) - 2.5
      state.position.y += (Math.random() * 5) - 2.5
      for (let c of connections) {
        c.trigger()
      }

      for (let n of nodes) {
        if ((n.state.position.dist(state.position) < 50) && (connections.length < 6)) {
          connections.some(c => c.id == n.id) && (n.id == id) ? "" : connect(n)
        }
      }
    }
  }

  return {
    id,
    connect,
    disconnect,
    getConnections: () => connections,
    state,
    trigger,
    update
  }
}

function addNodes(p, number, gridSize) {
  const seeder = () => {
    let counter = Math.random() * 100
    return () => counter += Math.random()
  }

  const x = seeder()
  const y = seeder()

  const nodes = Array.from({ length: number }).map(() => {
    const n = createNode()
    n.state.position = p.createVector(
      Math.ceil(Math.random() * innerWidth / gridSize) * gridSize,
      Math.ceil(Math.random() * innerHeight / gridSize) * gridSize,
    )
    // n.state.position = p.createVector(
    //   Math.ceil(p.noise(x()) * innerWidth / gridSize) * gridSize,
    //   Math.ceil(p.noise(y()) * innerHeight / gridSize) * gridSize,
    // )
    return n
  })



  for (let node of nodes) {
    for (let n of nodes) {
      if (node.state.position.dist(n.state.position) < (gridSize * 5)) {
        // TODO: connect only on angle (90)
        if (p.degrees((p5.Vector.sub(node.state.position, n.state.position)).heading()) % 90 == 0) {
          (node.getConnections()).length < 6 ? node.connect(n) : ""
        }

      }
    }
  }

  return nodes
}

//

function uniqueId() {
  return Math.random().toString(36).slice(2)
};

