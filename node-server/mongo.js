import { MongoClient } from "mongodb"
if (
  (process.env.NODE_ENV === "development" && !process.env.MONGO_URI) ||
  (process.env.NODE_ENV !== "development" && !process.env.MONGO_URI)
) {
  throw new Error('Invalid/Missing environment variable for: "MONGODB_URI')
}

const uri = process.env.MONGO_URI
const options = {}

let client
let clientPromise

console.log("setupMong......", process.env.NODE_ENV, process.env.MONGO_URI)
// If the database connection is cached,
// use it instead of creating a new connection
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    console.log("No Cached mongo connection... making new one")
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
