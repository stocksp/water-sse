// @ts-nocheck
import { createStore } from '$lib/uiData.svelte';
let reconnectTimer: string | number | NodeJS.Timeout | null | undefined = null;
let eventSource: EventSource | null = null;
let reconnectAttempts = 0;
let connectionId : string | null = null;

const store = createStore();

export function connectToStream() {
	if (eventSource) {
		eventSource.close();
	}

	eventSource = new EventSource('/api/sse');

	eventSource.onopen = () => {
		console.log('SSE connection opened');
		reconnectAttempts = 0;
		store.setIsConnected (true);
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	};

	eventSource.onerror = (err) => {
		console.error('SSE connection error:', err);
		store.setIsConnected(false);
		if (!reconnectTimer) {
			scheduleReconnect();
		}
	};

	eventSource.onmessage = handleMessage;

	// Ping the server every 20 seconds to keep the connection alive
	const pingInterval = setInterval(() => {
		if ($connectionId) {
			fetch('/api/sse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ connectionId: $connectionId })
			});
		}
	}, 20000);

	// Add event listener for visibility change
	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Return a cleanup function
	return () => {
		clearInterval(pingInterval);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		if (eventSource) {
			eventSource.close();
		}
	};
}
