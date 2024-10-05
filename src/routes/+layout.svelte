<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';

	import convertToPower from '$lib/convertToPower';
	
	import { store } from '$lib/uiData';
	
	

	

	let connectionId: string | null = null;
	let reconnectAttempts = 0;
	let isConnected = $state(false);
	let isVisible = $state(true);

	let eventSource: EventSource | null = null;
	let reconnectMaxDelay = 15000;

	let reconnectTimeout: number | null = null;

	function handleMessage(event: MessageEvent) {
		//console.log('Received SSE message:', event.data);

		let data: any;
		try {
			data = JSON.parse(event.data);
		} catch (error) {
			console.log('Failed to parse as JSON. Raw data:', event.data);
			console.log('Parse error:', error);
			data = event.data;
		}

		if (typeof data === 'object') {
			if (data.message === 'initial_data') {
				const waterData: WaterData = data.data;
				console.log('Received initial data:', waterData);
				const newData: UIData[] = convertToPower(data.data);
				console.log("initial data", newData)
				store.setUiData(newData);
			} else if (data.message === 'new_data') {
				const waterData: WaterData = data.data;
				console.log('Received new water data:', waterData);
				const newData: UIData[] = convertToPower(data.data);
				store.setUiData((currentData) => [...newData, ...currentData]);
			} else if (data.message === 'connection_status') {
				store.setActiveConnections(data.activeConnections);
				console.log('Updated active connections:', data.activeConnections);
				if (data.status === 'connected') {
					connectionId = data.id;
					console.log('Connected. Connection ID:', data.id);
				}
			} else if (data.message === 'connection_update') {
				store.setActiveConnections(data.activeConnections);
				console.log('Connection count updated. Total connections:', data.activeConnections);
			}
		} else if (typeof data === 'string') {
			console.log('Received string data:', data);
			// Handle any remaining string messages if necessary
		}
	}

	$effect(() => {
		console.log('is connected', isConnected, 'isVisible', isVisible);
		if (!isVisible) {
			console.log('closing event source, user tabbed away');
			eventSource?.close();
			eventSource = null;
			isConnected = false;
		} else if (!isConnected) {
			console.log('user tabbed back or not connected, reconnecting');
			scheduleReconnect();
		}
	});
	const scheduleReconnect = () => {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}

		const delay = Math.min(reconnectMaxDelay, Math.pow(2, reconnectAttempts) * 1000);
		console.log(`Scheduling reconnect in ${delay}ms`);

		reconnectTimeout = setTimeout(() => {
			console.log('Attempting to reconnect...');
			reconnectAttempts++;
			connectToStream();
		}, delay) as unknown as number;
	};
	let reconnectTimer: string | number | NodeJS.Timeout | null | undefined = null;
	function connectToStream() {
		if (eventSource) {
			eventSource.close();
		}

		eventSource = new EventSource('/api/sse');

		eventSource.onopen = () => {
			console.log('SSE connection opened');
			reconnectAttempts = 0;
			isConnected = true;
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
		};

		eventSource.onerror = (err) => {
			console.error('SSE connection error:', err);
			isConnected = false;
			if (!reconnectTimer) {
				scheduleReconnect();
			}
		};

		eventSource.onmessage = handleMessage;

		// Ping the server every 20 seconds to keep the connection alive
		const pingInterval = setInterval(() => {
			if (connectionId) {
				fetch('/api/sse', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ connectionId: connectionId })
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
	onMount(() => {
		const cleanup = connectToStream();

		return () => {
			cleanup();
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
			}
		};
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
		}
	});
	const handleVisibilityChange = () => {
		isVisible = !document.hidden;
		console.log('is visible', isVisible);
		if (isVisible && !isConnected) {
			scheduleReconnect();
		}
	};
</script>

<div class="app">
	<main>
		<slot></slot>
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
