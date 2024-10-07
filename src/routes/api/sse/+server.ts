import { type RequestHandler } from '@sveltejs/kit';
import { getWaterData } from '$lib/server/getWaterData'; // Adjust the import path as necessary
let connectionCounter = 0;
let connections: Map<string, Connection> = new Map();
let messageInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;
let dataCleanupInterval: NodeJS.Timeout | null = null;

let lookbackDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
let savedWaterData: WaterData = { message: 'ok', distDocs: [], powerDocs: [] };

function sendSSEMessage(message: string | object) {
	const now = Date.now();
	console.log('connections:', connections.size)
	connections.forEach((connection, id) => {
		if (now - connection.lastPing > 30000) {
			connections.delete(id);
			console.log('deleting connection', id)
		} else {
			try {
				const messageString = typeof message === 'string' ? message : JSON.stringify(message);
				connection.controller.enqueue(`data: ${messageString}\n\n`);
			} catch (error) {
				if (error instanceof TypeError && error.message.includes('Controller is already closed')) {
					connections.delete(id);
					console.log('deleting connection', id)
				} else {
					console.error(`Error sending message to connection ${id}:`, error);
				}
			}
		}
	});

	if (connections.size === 0) {
		console.log('STOPPING... no clients');
		stopIntervals();
	}
}

function filterOldData() {
	const twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

	savedWaterData.distDocs = savedWaterData.distDocs.filter((doc) => doc.when >= twoWeeksAgo);
	savedWaterData.powerDocs = savedWaterData.powerDocs.filter((doc) => doc.when >= twoWeeksAgo);
}

function getLookbackDate(data: WaterData): Date {
	const dates: Date[] = [];
	if (data.distDocs.length > 0) dates.push(new Date(data.distDocs[0].when));
	if (data.powerDocs.length > 0) dates.push(new Date(data.powerDocs[0].when));
	const result =
		dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : lookbackDate;
	console.log('getLookbackDate result:', result.toLocaleString());
	return result;
}

function updateSavedData(newData: WaterData) {
	savedWaterData.distDocs = [...newData.distDocs, ...savedWaterData.distDocs];
	savedWaterData.powerDocs = [...newData.powerDocs, ...savedWaterData.powerDocs];
}

async function fetchAndProcessWaterData() {
	try {
		const waterData: WaterData = await getWaterData(lookbackDate);
		console.log('New Water Data:', {
			message: waterData.message,
			distDocs: waterData.distDocs.length,
			powerDocs: waterData.powerDocs.length
		});

		if (waterData.message === 'ok') {
			const newLookbackDate = getLookbackDate(waterData);
			console.log('Current lookbackDate:', lookbackDate.toLocaleString());
			console.log('New lookbackDate:', newLookbackDate.toLocaleString());

			if (newLookbackDate > lookbackDate) {
				lookbackDate = newLookbackDate;
				updateSavedData(waterData);
				sendSSEMessage(
					JSON.stringify({
						message: 'new_data',
						data: waterData
					})
				);
				console.log('Sent new data to clients');
			} else {
				console.log(
					'No new data to send (newLookbackDate <= lookbackDate)',
					'connections',
					connections.size
				);
			}
		} else {
			console.error('Error in water data:', waterData.Error);
		}
	} catch (error) {
		console.error('Error fetching water data:', error);
	}
}

async function startIntervals() {
	console.log('starting intervals');
	if (!messageInterval) {
        messageInterval = setInterval(fetchAndProcessWaterData, 10000); // simplified
        console.log('!!!setting messageInterval');
    }

	if (!cleanupInterval) {
		cleanupInterval = setInterval(() => {
			const now = Date.now();
			connections.forEach((connection, id) => {
				if (now - connection.lastPing > 30000) {
					connections.delete(id);
					console.log('Removing connection:', id);
				}
			});
		}, 60000);
	}
	if (!dataCleanupInterval) {
		// Initial cleanup
		filterOldData();

		dataCleanupInterval = setInterval(() => {
			filterOldData();
		}, 120000); // Run every 2 minutes (120000 ms)
	}
}

function stopIntervals() {
	console.log('Stopping intervals');
    if (messageInterval) clearInterval(messageInterval);
    if (cleanupInterval) clearInterval(cleanupInterval);
    if (dataCleanupInterval) clearInterval(dataCleanupInterval);
    messageInterval = null;
    cleanupInterval = null;
    dataCleanupInterval = null; //Explicitly set to null after clearing
}

export const GET: RequestHandler = () => {
	const connectionId = (connectionCounter++).toString();
	console.log('======= STARTING GET =========', connectionId);
	
	const stream = new ReadableStream({
		start(controller) {
			connections.set(connectionId, { controller, lastPing: Date.now() });
			console.log('start controller .... connections', connections.size)

			if (connections.size === 1) {
				startIntervals();
			}

			// Send connection status to the new client
			controller.enqueue(
				`data: ${JSON.stringify({
					message: 'connection_status',
					id: connectionId,
					activeConnections: connections.size,
					status: 'connected'
				})}\n\n`
			);

			// Notify all clients about the new connection
			console.log('sendSSEMessage connection_update')
			sendSSEMessage(
				JSON.stringify({
					message: 'connection_update',
					activeConnections: connections.size
				})
			);

			// Send saved data to new client
			if (savedWaterData.distDocs.length > 0 || savedWaterData.powerDocs.length > 0) {
				controller.enqueue(
					`data: ${JSON.stringify({
						message: 'initial_data',
						data: savedWaterData
					})}\n\n`
				);
			}
		},
		cancel() {
			connections.delete(connectionId);
			// Notify all remaining clients about the closed connection
			sendSSEMessage(
				JSON.stringify({
					message: 'connection_update',
					activeConnections: connections.size
				})
			);
			if (connections.size === 0) {
				stopIntervals();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

export const POST: RequestHandler = async ({ request }) => {
	
	const { connectionId } = await request.json();
	const connection = connections.get(connectionId);
	console.log('POST handler connectionId:', connectionId)
	if (connection) {
		connection.lastPing = Date.now();
	}
	return new Response(null, { status: 204 });
};
