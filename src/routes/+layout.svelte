<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';

	import convertToPower from '$lib/convertToPower';

	import { store } from '$lib/uiData.svelte';

	let { children } = $props();

	let connectionId: string | null = null;
	let reconnectAttempts = 0;

	let isVisible = $state(true);

	let eventSource: EventSource | null = $state(null);
	let reconnectMaxDelay = 15000;

	let reconnectTimeout: NodeJS.Timeout | null = null;
	let pingInterval: number | NodeJS.Timeout | null = null;

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
				//console.log('initial data', newData);
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
		console.log('is connected', store.getIsConnected, 'isVisible', isVisible);
		if (!isVisible) {
			console.log('closing event source, user tabbed away');
			eventSource?.close();
			eventSource = null;
			store.setIsConnected(false);
		} else if (!store.getIsConnected) {
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
		}, delay);
	};
	let reconnectTimer: string | number | NodeJS.Timeout | null | undefined = null;
	function connectToStream() {
		if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
			return;
		}

		eventSource = new EventSource('/api/sse');

		eventSource.onopen = () => {
			console.log('SSE connection opened');
			reconnectAttempts = 0;
			store.setIsConnected(true);
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
		
		if (pingInterval) {
				clearInterval(pingInterval);
			}
		// Ping the server every 20 seconds to keep the connection alive
		pingInterval = setInterval(() => {
			if (connectionId) {
				console.log('ping server:', connectionId)
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
			console.log('cleaning up');
			clearInterval(pingInterval as number);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (eventSource) {
				eventSource.close();
			}
		};
	}
	onMount(() => {
		connectToStream();
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}
		if (pingInterval) {
			clearInterval(pingInterval);
		}
	});
	const handleVisibilityChange = () => {
		isVisible = !document.hidden;
		console.log('is visible', isVisible);
		if (isVisible && !store.getIsConnected) {
			scheduleReconnect();
		}
	};
</script>

<div class="app">
	<main>
		{@render children()}
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
