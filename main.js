import './style.css'
import p5 from "p5"

new p5(sketch)

/**
* This is a p5 sketch.
* @param {p5} p - The p5 instance.
*/
function sketch(p) {
  const gridSize = 10
  const amount = (innerWidth / gridSize) * (innerHeight / gridSize)
  console.log(amount)
  const { nodes, connections, possibleConnections } = addNodes(p, parseInt(amount * 0.1), gridSize)

  console.log(connections)

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
    p.fill(255)
    p.noStroke()
    p.text(parseInt(p.frameRate()), 10, 20)
    const mouse = p.createVector(p.mouseX, p.mouseY)
    // p.stroke(white)
    // for (let node of nodes) {
    //   const { x, y } = node.state.position
    //   const s = p.map(node.state.energy, 0, node.state.size, 1, 2)
    //   p.strokeWeight(p.map(mouse.dist(node.state.position), 0, 250, s * 2, s, true))
    //   const e = p.map(node.state.energy, 5, node.state.size, 0, 1, true)
    //   for (let { state: { position: c } } of node.getConnections()) {
    //     p.stroke(white)
    //     if (node.state.recentlyFired) {
    //       (node.getConnections()).length <= 5 ? p.stroke(star) : p.stroke(green)
    //     }

    //     p.line(x, y, c.x, c.y)

    //     // animate lines
    //     p.line(p.lerp(x, c.x, 1 - e), p.lerp(y, c.y, 1 - e), c.x, c.y)



    //   }
    // }




    // connections
    p.strokeWeight(1)
    for (let id in connections) {
      const c = connections[id]

      const { a, b } = c
      // randomly trigger
      // if (Math.random() > 0.999) {
      //   for (let cid of c.a.connections) {
      //     c.a.trigger()
      //     connections[cid].transmitFrom(a)
      //   }
      // }
      p.stroke(white)
      p.strokeWeight(3)
      p.line(a.state.position.x, a.state.position.y, b.state.position.x, b.state.position.y)

      // render
      if (c.state.isActive) {
        (a.connections).length > 1 ? p.stroke(green) : p.stroke(star)
        const [x, y, xx, yy] = c.state.direction == 0 ?
          [
            p.lerp(b.state.position.x, a.state.position.x, p.min(c.state.progress, 1)),
            p.lerp(b.state.position.y, a.state.position.y, p.min(c.state.progress, 1)),
            p.lerp(b.state.position.x, a.state.position.x, p.max(0, c.state.progress - 5)),
            p.lerp(b.state.position.y, a.state.position.y, p.max(0, c.state.progress - 5)),
          ] :
          [
            p.lerp(a.state.position.x, b.state.position.x, p.min(c.state.progress, 1)),
            p.lerp(a.state.position.y, b.state.position.y, p.min(c.state.progress, 1)),
            p.lerp(a.state.position.x, b.state.position.x, p.max(0, c.state.progress - 5)),
            p.lerp(a.state.position.y, b.state.position.y, p.max(0, c.state.progress - 5)),
          ]

        p.line(x, y, xx, yy)
        // p.ellipse(x, y, 5, 5)
      }
      // p.line(a.state.position.x, a.state.position.y, b.state.position.x, b.state.position.y)

      c.update()
    }

    //nodes
    for (let node of nodes) {
      const { x, y } = node.state.position
      const scaler = (p.map(mouse.dist(node.state.position), 0, 250, 1, 0.5, true))
      node.state.position.dist(mouse) < 50 && node.connections.length > 1 ? node.trigger() : ""
      p.fill(white)
      p.noStroke()
      const s = scaler * node.state.size * 2
      const s2 = p.map(node.state.glow, 0, 1, 0, 1, true)
      p.ellipse(x, y, s, s)
      // p.text((node.state.stamina).toFixed(2), x, y - 10)
      if (node.state.glow > 0) {
        (node.connections).length > 1 ? p.fill(green) : p.fill(star)
        p.ellipse(x, y, s * s2, s * s2)
      }

      if (node.state.energy == 1) {
        // if (p.mouseIsPressed && node.state.position.dist(mouse) < 25) {
        if (p.mouseIsPressed && node.connections.length <= 3 && node.state.position.dist(mouse) < 50) {
          const newConnectionId = node.possibleConnections[parseInt(Math.random() * node.possibleConnections.length)]
          const newConnection = possibleConnections[newConnectionId]
          if (newConnection) {
            connections[newConnectionId] = newConnection
            possibleConnections[newConnectionId] = undefined

            // TODO: only make new attachment if 1 or less connection
            newConnection.b.connections.push(newConnectionId)
            newConnection.a.connections.push(newConnectionId)
            // newConnection.b.connections.push(newConnection)
            // node.state.position.x += Math.random() * 10 - 5
            // node.state.position.y += Math.random() * 10 - 5
          }
        }
        for (let id of node.connections) {
          connections[id].transmitFrom(node.id)
        }
      }

      node.update()
    }
  }
}

function createConnection(nodePair) {
  if (nodePair && Array.isArray(nodePair) && nodePair.length !== 2) return

  if (nodePair[0].id == nodePair[1].id) return

  // console.log(nodePair)

  const id = nodePair.map(n => n.id).sort().join("-")

  const state = {
    isActive: false,
    progress: 0,
    direction: false
  }

  // Note: make shift delay
  let action = () => { }

  const [a, b] = nodePair

  const transmitFrom = (nodeId) => {
    if (state.isActive) return

    const isA = nodeId == a.id
    state.direction = isA

    const to = isA ? b : a
    state.isActive = true
    action = () => to.trigger()
  }

  const update = () => {
    // TODO: make count a state and lerp from it with animation
    // TODO: set direction so can animate correctly
    if (state.isActive) {
      state.progress += 0.1
      // trigger node
      if (state.progress > 1 && action) {
        action()
        action = undefined
      }
      // remain active to block other signals for a time
      if (state.progress >= 6) {
        state.isActive = false
        state.progress = 0
      }
    }
  }

  return {
    id,
    a,
    b,
    update,
    state,
    transmitFrom
  }
}

/**
 * createNode
 * @param {number} x
 * @param {number} y
 * @returns 
 */
function createNode(x, y) {
  const id = uniqueId()
  const state = {
    size: 5,
    energy: 0,
    glow: 0,
    position: new p5.Vector(x, y),
    stamina: 0
  }

  // connection id's
  const connections = []
  const possibleConnections = []

  const trigger = () => {
    if (state.stamina > 1) return

    state.energy = 1
    state.stamina += 0.1
    state.glow = 4
  }

  const update = () => {
    if (state.energy == 1) {
      // state.position.x += Math.random() * 10 - 5
      // state.position.y += Math.random() * 10 - 5
      state.energy = 0
    }
    if (state.stamina > 1) {
      state.stamina += 0.1
    }
    if (state.stamina > 2) {
      state.stamina = 0
    }
    if (state.glow > 0) {
      state.glow -= 0.05
    }

  }

  return {
    id,
    connections,
    possibleConnections,
    state,
    trigger,
    update
  }
}

/**
 * addNodes
 * @param {p5} p
 * @param {number} number
 * @param {number} gridSize
 * @returns
 */
function addNodes(p, number, gridSize) {

  const nodes = Array.from({ length: number }).map(() => {
    return createNode(
      Math.ceil(Math.random() * innerWidth / gridSize) * gridSize,
      Math.ceil(Math.random() * innerHeight / gridSize) * gridSize,
    )
  })

  // let x = 0
  // const nodes = Array.from({ length: 20 }).map(() => {
  //   x += 50
  //   return createNode(
  //     x,
  //     innerHeight / 2,
  //   )
  // })

  // TODO: refactor out to createConnections(nodes)

  const connections = {}
  const possibleConnections = {}

  // add initial connections
  const angle = 90
  const connectionLength = 5
  const maxConnections = 1

  for (let node of nodes) {
    connections: for (let n of nodes) {
      if (node.state.position.dist(n.state.position) > gridSize * connectionLength) {
        continue connections
      }

      if (node.connections.length > maxConnections) {
        continue connections
      }

      // add possible connections here to save looping over all nodes of nodes in draw
      const possibleConnection = createConnection([node, n])

      if (p.degrees((p5.Vector.sub(n.state.position, node.state.position)).heading()) % angle != 0) {
        if (possibleConnection) {
          possibleConnections[possibleConnection.id] = possibleConnection
          if (!node.possibleConnections.find(c => c == possibleConnection.id)) {
            node.possibleConnections.push(possibleConnection.id)
            n.possibleConnections.push(possibleConnection.id)
          }
        }
        continue connections
      }

      const connection = createConnection([node, n])
      if (connection) {
        connections[connection.id] = connection
        if (!node.connections.find(c => c == connection.id)) {
          node.connections.push(connection.id)
          n.connections.push(connection.id)
        }
      }
    }
  }

  return { nodes, connections, possibleConnections }
}

//

function uniqueId() {
  return Math.random().toString(36).slice(2)
};

