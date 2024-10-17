import { MONGO_URI } from '$env/static/private';
import { MongoClient } from "mongodb"

const client = new MongoClient(MONGO_URI, {})
const clientPromise = client.connect()

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db() // Or specify a database name: client.db('your_db_name')
}