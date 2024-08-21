// src/routes/api/sse/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { getWaterData } from '$lib/server/getWaterData'; // Adjust the import path as necessary

let connections: Map<string, Connection> = new Map();
let connectionCounter = 0;
let messageInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;
let lookbackDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
let savedWaterData: WaterData = { message: 'ok', distDocs: [], powerDocs: [] };

function sendSSEMessage(message: string, newClient: boolean = false) {
  const now = Date.now();
  connections.forEach((connection, id) => {
    if (now - connection.lastPing > 30000) {
      connections.delete(id);
    } else {
      try {
        if (newClient) {
          connection.controller.enqueue(`data: ${message}\n\n`);
        } else {
          connection.controller.enqueue(`data: ${message} | Active connections: ${connections.size}\n\n`);
        }
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('Controller is already closed')) {
          connections.delete(id);
        } else {
          console.error(`Error sending message to connection ${id}:`, error);
        }
      }
    }
  });

  if (connections.size === 0) {
    stopIntervals();
  }
}

function getLookbackDate(data: WaterData): Date {
  const dates: Date[] = [];
  if (data.distDocs.length > 0) dates.push(new Date(data.distDocs[0].when));
  if (data.powerDocs.length > 0) dates.push(new Date(data.powerDocs[0].when));
  return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : lookbackDate;
}

function updateSavedData(newData: WaterData) {
  savedWaterData.distDocs = [...newData.distDocs, ...savedWaterData.distDocs];
  savedWaterData.powerDocs = [...newData.powerDocs, ...savedWaterData.powerDocs];
}

async function fetchAndProcessWaterData() {
    try {
      const waterData: WaterData = await getWaterData(lookbackDate);
      console.log('New Water Data:', waterData);
  
      if (waterData.message === 'ok') {
        const newLookbackDate = getLookbackDate(waterData);
        if (newLookbackDate > lookbackDate) {
          lookbackDate = newLookbackDate;
          updateSavedData(waterData);
          sendSSEMessage(JSON.stringify({
            message: 'new_data',
            data: waterData
          }));
        }
      } else {
        console.error('Error in water data:', waterData.Error);
      }
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  }
  

async function startIntervals() {
  if (!messageInterval) {
    // Initial fetch
    await fetchAndProcessWaterData();

    messageInterval = setInterval(async () => {
      const message = `Hello at ${new Date().toISOString()}`;
      sendSSEMessage(message);
      await fetchAndProcessWaterData();
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
      
      if (connections.size === 1) {
        startIntervals();
      }

      controller.enqueue(`data: Connected. ID: ${connectionId} | Active connections: ${connections.size}\n\n`);
      
      // Send saved data to new client
      if (savedWaterData.distDocs.length > 0 || savedWaterData.powerDocs.length > 0) {
        controller.enqueue(`data: ${JSON.stringify({
          message: 'initial_data',
          data: savedWaterData
        })}\n\n`);
      }

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
