// src/routes/api/sse/+server.ts
import { type RequestHandler } from '@sveltejs/kit';

interface Connection {
  controller: ReadableStreamDefaultController;
  lastPing: number;
}

let connections: Map<string, Connection> = new Map();
let connectionCounter = 0;
let messageInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

function sendSSEMessage(message: string) {
  const now = Date.now();
  const activeConnections = connections.size;
  connections.forEach((connection, id) => {
    if (now - connection.lastPing > 30000) {
      connections.delete(id);
    } else {
      try {
        connection.controller.enqueue(`data: ${message} | Active connections: ${activeConnections}\n\n`);
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('Controller is already closed')) {
          connections.delete(id);
        } else {
          console.error(`Error sending message to connection ${id}:`, error);
        }
      }
    }
  });

  // Stop intervals if no connections remain
  if (connections.size === 0) {
    stopIntervals();
  }
}

function startIntervals() {
  if (!messageInterval) {
    messageInterval = setInterval(() => {
      const message = `Hello at ${new Date().toISOString()}`;
      sendSSEMessage(message);
    }, 10000);
  }

  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      connections.forEach((connection, id) => {
        if (now - connection.lastPing > 30000) {
          connections.delete(id);
        }
      });
    }, 60000);
  }
}

function stopIntervals() {
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export const GET: RequestHandler = () => {
  const connectionId = (connectionCounter++).toString();

  const stream = new ReadableStream({
    start(controller) {
      connections.set(connectionId, { controller, lastPing: Date.now() });
      
      // Start intervals if this is the first connection
      if (connections.size === 1) {
        startIntervals();
      }

      controller.enqueue(`data: Connected. ID: ${connectionId} | Active connections: ${connections.size}\n\n`);

      return () => {
        connections.delete(connectionId);
        sendSSEMessage(`Connection closed. ID: ${connectionId}`);
      };
    },
    cancel() {
      connections.delete(connectionId);
      if (connections.size === 0) {
        stopIntervals();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const { connectionId } = await request.json();
  const connection = connections.get(connectionId);
  if (connection) {
    connection.lastPing = Date.now();
  }
  return new Response(null, { status: 204 });
};
