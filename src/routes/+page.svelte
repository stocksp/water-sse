<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import convertToPower from '$lib/convertToPower';
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';
	import { createStore } from '$lib/uiData.svelte';

	const store = createStore();

	let activeConnections = writable<number>(0);
	let connectionId = writable<string | null>(null);
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
				console.log('Received new water data:', waterData);
				const newData: UIData[] = convertToPower(data.data);
				store.set(newData);
			} else if (data.message === 'new_data') {
				const waterData: WaterData = data.data;
				console.log('Received new water data:', waterData);
				const newData: UIData[] = convertToPower(data.data);
				store.get().unshift(...newData);
			} else if (data.message === 'connection_status') {
				activeConnections.set(data.activeConnections);
				console.log('Updated active connections:', data.activeConnections);
				if (data.status === 'connected') {
					connectionId.set(data.id);
					console.log('Connected. Connection ID:', data.id);
				}
			} else if (data.message === 'connection_update') {
				activeConnections.set(data.activeConnections);
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
	function makeTime(seconds: number) {
		return (seconds / 60).toFixed(1) + ' mins';
	}

	const getBGColor = (data: any) => {
		switch (data.pump) {
			case 'well':
				return `background-color: rgba(255, 99, 71, 0.5)`;
			case 'pressure':
				return `background-color: rgb(173, 175, 204)`;
			default:
				return ``;
		}
	};
	function getWhat(r: any) {
		return r.distance ? 'Distance' : r.state ? r.state : 'Voltage';
	}
	function doTd(r: any) {
		if (r.distance) {
			return r.distance;
		} else if (r.voltage) {
			return r.voltage;
		} else if (r.runTime) {
			return makeTime(r.runTime);
		} else if (r.state === 'Well running') {
			return r.state;
		} else {
			return '-----';
		}
	}
	function doFormat(theDate: Date) {
		const options = {
			month: 'short' as 'short' | 'numeric' | '2-digit' | 'long' | 'narrow',
			day: 'numeric' as 'numeric' | '2-digit',
			hour: 'numeric' as 'numeric' | '2-digit',
			minute: 'numeric' as 'numeric' | '2-digit',
			second: 'numeric' as 'numeric' | '2-digit',
			hour12: true
		};

		return theDate.toLocaleString('en-US', options);
	}
	function currentDistance() {
		if (!store.get().length) return 0;
		// @ts-ignore
		return store.get().find((v) => v.distance).distance;
	}
	function isWellRunning() {
		const resp = store.get().find((v) => 'state' in v && v.state === 'Well running') as
			| PowerDoc
			| undefined;
		if (resp) {
			const formattedTime = resp.when.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit',
				hour12: true
			});
			return `<h4 style="background-color: rgba(255, 99, 71, 0.5)">Well pump is on... started ${formattedTime}</h4>`;
		}
		return '';
	}
	function isPressureRunning() {
		const resp = store.get().find((v) => 'state' in v && v.state === 'Pressure running') as
			| PowerDoc
			| undefined;
		if (resp) {
			const formattedTime = resp.when.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit',
				hour12: true
			});
			return `<h4 style="background-color: rgba(173, 175, 204)">Pressure pump is on... started ${formattedTime}</h4>`;
		}
		return '';
	}
</script>

<h1>SSE Messages</h1>
<h3>Active Connections: {$activeConnections}</h3>
<div>
	<h1 class="text-center">
		<span class="tinyIcon">💦</span>
		<span class="mediumIcon">💦</span>
		💦Water Report💦
		<span class="mediumIcon">💦</span>
		<span class="tinyIcon">💦</span>
	</h1>
	{#if store.get().length > 0}
		<div>
			<h3 class="center">
				Current well distance <strong>{currentDistance()}</strong>{' '}
			</h3>
			{@html isWellRunning()}
			{@html isPressureRunning()}
			<div class="box">
				<div class="column">
					<h3 class="center">Well Height</h3>
					<table>
						<thead>
							<tr>
								<th>What</th>
								<th>When</th>
								<th>Dist <br /> Time</th>
							</tr>
						</thead>
						<tbody>
							{#each store.get() as r, i (i)}
								<tr style={getBGColor(r)}>
									<td>{getWhat(r)}</td>
									<td>{@html doFormat((r as unknown as PowerDoc | DistDoc).when)}</td>
									<td>{doTd(r)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="column">
					<WellReport groups={getWellRuntimeData(store.get())} />
				</div>
			</div>
		</div>
	{:else}
		<div>NO Data</div>
	{/if}
</div>

<style>
	.box {
		display: flex;
		align-items: stretch;
		gap: 20px;
	}
	td {
		text-align: center;
	}
	.center {
		text-align: center;
	}
</style>
