import { streamSSE } from "hono/streaming"
import clientPromise from "../mongo.js"
import { format, differenceInMinutes, differenceInHours, isAfter } from "date-fns"
import { logger } from "hono/logger"
import { timing } from "hono/timing"
import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url';
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to write data to a file
const writeDataToFile = (data) => {
  const filePath = path.join(__dirname, "data_logs.json")
  fs.appendFile(filePath, `${data}\n`, (err) => {
    if (err) {
      console.error("Error writing to file", err)
    } else {
      console.log("Data successfully written to file")
    }
  })
}
const activeConnections = {}
export const sseEndpoint = (app) => {
  app.use("/api/sse", logger())
  app.use("/api/sse", timing())
  app.use("/api/sse", async (c, next) => {
    c.header("Content-Type", "text/event-stream")
    c.header("Cache-Control", "no-cache")
    c.header("Connection", "keep-alive")
    await next()
  })
  app.get("/api/sse", async (c) => {
    let lookBackTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const connectionId = Date.now() + Math.random().toString(16) // Unique ID for the connection

    return streamSSE(
      c,
      async (stream) => {
        console.log("starting new SSE data stream with:", lookBackTime.toLocaleDateString())
        const logMessage = `starting new SSE data stream with: ${lookBackTime.toLocaleDateString()}`
        fetch(
          `https://doclog.solenlabs.com/api/ingest/123456/paul?message=${encodeURIComponent(
            logMessage
          )}`
        )
        let aborted = false
        //let id = 0

        // Set the aborted flag when the stream is aborted
        stream.onAbort(() => {
          console.log("stream aborted!")
          aborted = true
          delete activeConnections[connectionId] // Remove connection from tracking when aborted
          fetch(
            `https://doclog.solenlabs.com/api/ingest/123456/paul?message=${encodeURIComponent(
              "stream aborted"
            )}`
          )
        })

        while (!aborted) {
          activeConnections[connectionId] = Date.now() // Update last active time
          const newWaterData = await getWaterData(c, lookBackTime)
          if (newWaterData.message === "ok") {
            if (newWaterData.distDocs.length === 0 && newWaterData.powerDocs.length === 0) {
              await stream.sleep(10000)
              continue
            }
            // const dataString = JSON.stringify(newWaterData)
            // // Write data to file
            // writeDataToFile(dataString)
            await stream.writeSSE({
              data: JSON.stringify(newWaterData),
              event: "message",
            })
            const distWhen = newWaterData.distDocs.length > 0 ? newWaterData.distDocs[0].when : null
            const powerWhen =
              newWaterData.powerDocs.length > 0 ? newWaterData.powerDocs[0].when : null

            if (distWhen && powerWhen) {
              lookBackTime = distWhen > powerWhen ? distWhen : powerWhen
            } else if (distWhen) {
              lookBackTime = distWhen
            } else lookBackTime = powerWhen
          } else {
            console.log("Failed to get Mongo data", newWaterData.Error)
            const logMessage = `Failed to get Mongo data: ${newWaterData.Error}`
            fetch(
              `https://doclog.solenlabs.com/api/ingest/123456/paul?message=${encodeURIComponent(
                logMessage
              )}`
            )
          }
          await stream.sleep(10000)
        }
      },
      (error, stream) => {
        console.log("Error streaming data", error, { stream })
        const logMessage = `Error streaming data, ${error}`
        fetch(
          `https://doclog.solenlabs.com/api/ingest/123456/paul?message=${encodeURIComponent(
            logMessage
          )}`
        )
      }
    )
  })
}

const getWaterData = async (c, lookBackTime) => {
  try {
    console.log(
      "starting getGetWaterData!",
      new Date().toLocaleString(),
      "from",
      lookBackTime.toLocaleString()
    )
    const client = await clientPromise
    const db = client.db()
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const distDocs = await db
      .collection("waterDistance")
      .find({ when: { $gt: lookBackTime } })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    const powerDocs = await db
      .collection("power")
      .find({
        when: { $gt: lookBackTime },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()

    console.log("found", distDocs.length, powerDocs.length, format(Date.now(), "MMM d, h:mm:ss a"))
    return { message: "ok", distDocs, powerDocs }
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    console.log("bad news in mongo", message)
    return { message: "error", Error: message }
  }
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
    const logMessage = `Active SSE connections: ${activeCount}`
    fetch(
      `https://doclog.solenlabs.com/api/ingest/123456/paul?message=${encodeURIComponent(
        logMessage
      )}`
    )
  }
}, 30000)
