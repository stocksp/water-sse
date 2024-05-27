import "dotenv/config"
import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { timing } from "hono/timing"
import { streamSSE } from "hono/streaming"
//import tursoClient from "./api/tursoClient.js"
//import { ingestEndpoint, ingestIconEndpoint } from "./api/ingest.js"
import getData from './api/getData.js'
import { sseEndpoint } from "./api/sse.js"

const app = new Hono()

/* export const customLogger = (message, ...rest) => {
  console.log(message, ...rest)
} */

app.use(
  "*",
  cors({
    // origin: [process.env.FRONTEND_URL],
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    // allowHeaders: ["Content-Type", "Authorization"],
    // credentials: true,
  })
)

app.get("/", (c) => {
  return c.text("access denied")
})

sseEndpoint(app)
//app.use("/api/*", logger(customLogger))
//app.use("/api/*", timing())

// Endpoint for ingesting logs for a specific token and channel
//ingestEndpoint(app)

/* const activeConnections = {}
let id = 0
app.use("/api/sse/:tableName", async (c, next) => {
  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")
  await next()
}) */

app.get("/api/getData", getData)
/* 
app.get("/api/sse/:tableName", async (c) => {
  // Retrieve table name and last ID from the request
  const tableName = c.req.param("tableName")
  let lastId = 0
  // const lastId = c.req.query("lastId")
  const connectionId = Date.now() + Math.random().toString(16) // Unique ID for the connection
  return streamSSE(
    c,
    async (stream) => {
      console.log("starting new SSE log stream")
      let aborted = false

      // Set the aborted flag when the stream is aborted
      stream.onAbort(() => {
        console.log("stream aborted!")
        aborted = true
        delete activeConnections[connectionId] // Remove connection from tracking when aborted
      })

      while (!aborted) {
        activeConnections[connectionId] = Date.now() // Update last active time
         const newLogData = await getLogData(tableName, lastId)
        if (newLogData.length > 0) {
          await stream.writeSSE({
            data: JSON.stringify(newLogData),
            event: "message",
            id: String(id++),
          })
          const maxId = Math.max(...newLogData.map((log) => log.ID))
          lastId = maxId
        } 
        await stream.sleep(1000)
      }
    },
    (err, stream) => {
      console.log("Error streaming data", err, { stream })
    }
  )
}) 
 */
/* const getLogData = async (tableName, lastId) => {
  let sqlQuery = ""
  let args = []

  // Construct SQL query based on the presence of lastId
  if (lastId > 0) {
    sqlQuery = `SELECT ID, data FROM ${tableName} WHERE ID > ? ORDER BY ID ASC`
    args = [lastId]
  } else {
    sqlQuery = `SELECT ID, data FROM ${tableName} ORDER BY ID DESC`
  }

  // Execute the SQL query
  const result = await tursoClient.execute({
    sql: sqlQuery,
    args: args,
  })

  // Parse the data from each row and add the ID to the result
  const newData = result.rows
    .map((row) => ({
      ID: row.ID,
      ...JSON.parse(row.data),
    }))
    .sort((a, b) => a.ID - b.ID)

  // Return the new data as JSON
  return newData
}
 
// Periodically prune old connections and log the number of active connections
setInterval(() => {
  const now = Date.now()
  Object.keys(activeConnections).forEach((key) => {
    if (now - activeConnections[key] > 5000) {
      delete activeConnections[key] // Prune connections older than 5 seconds
    }
  })
  const activeCount = Object.keys(activeConnections).length
  if (activeCount > 0) {
    console.log(`Active SSE connections: ${activeCount}`)
  }
}, 30000)
*/
// STATIC FILE SERVING
//
// TODO - look into cache-control to improve static file delivery performance in koyeb
//         https://www.koyeb.com/blog/using-cache-control-and-cdns-to-improve-performance-and-reduce-latency
//         https://hono.dev/middleware/builtin/cache

/* app.use("/embed/*", async (c, next) => {
  // code here runs before the next middleware or route for this path
  await next()
  console.log(`React app served to origin: ${c.req.header("Origin")}`) // runs after the next middleware or route fires
})
app.use("/embed/*", serveStatic({ path: "./static/index.html" })) */
app.get(
  "/assets/*",
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) => path.replace(/^\/assets/, "/static/assets"),
  })
)
app.get(
  "/:filename{.+\\.(png|ico)$}",
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) => path.replace(/^\//, "/static/"),
  })
)

const port = process.env.PORT || 4000
console.log(`Server is running on port ${port}`)
serve({
  fetch: app.fetch,
  port,
})
