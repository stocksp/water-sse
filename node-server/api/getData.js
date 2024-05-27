import clientPromise from "../mongo.js"
import { format, differenceInMinutes, differenceInHours, isAfter } from "date-fns"

const handler = async (c) => {
  try {
    console.log("starting getData!")
    const client = await clientPromise
    const db = client.db()
    // look back 5 days = 5 * 24 * 60 * 60 * 1000
    const distDocs = await db
      .collection("waterDistance")
      .find({ when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    const powerDocs = await db
      .collection("power")
      .find({
        when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    const voltageDocs = await db
      .collection("voltage")
      .find({
        when: { $gt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      })
      .project({ _id: 0 })
      .sort({ _id: -1 })
      .toArray()
    console.log("found", distDocs.length, powerDocs.length, voltageDocs.length, format(Date.now(), "MMM d, h:mm:ss a"))
    return c.json({ message: "ok", distDocs, powerDocs, voltageDocs })
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    return c.json({ Error: message }, 404)
  }

  // TODO - Update state in mongo to persist
  //res.json(state);
}

export default handler
