<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import convertToPower from '$lib/convertToPower';
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';

	let messages = writable<string[]>([]);
	let activeConnections = writable<number>(0);
	let connectionId = writable<string | null>(null);
	let uiData = $state<UIData[]>([]);
	let reconnectAttempts = $state(0);
	let isConnected = $state(false);
	let isVisible = $state(true);
	let userTabbedAway = $state(false);

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
				//console.log('Successfully parsed and convert JSON data:', convertToPower(data.data));
				uiData = convertToPower(data.data);
				const waterData: WaterData = data.data;
				console.log('Received initial water data:', waterData);
				messages.set([
					`distDocs: ${waterData.distDocs.length}, powerDocs: ${waterData.powerDocs.length}`
				]);
			} else if (data.message === 'new_data') {
				const waterData: WaterData = data.data;
				console.log('Received new water data:', waterData);
				/* messages.update((msgs) => [
					...msgs,
					`distDocs: ${waterData.distDocs.length}, powerDocs: ${waterData.powerDocs.length}`
				]); */
				const newData = convertToPower(data.data);
				uiData.unshift(...newData);
			} else if (data.message === 'connection_status') {
				activeConnections.set(data.activeConnections);
				console.log('Updated active connections:', data.activeConnections);
				if (data.status === 'connected') {
					connectionId.set(data.id);
					console.log('Set connection ID:', data.id);
				} else if (data.status === 'client_connected') {
					console.log('New client connected. Total connections:', data.activeConnections);
				} else if (data.status === 'client_disconnected') {
					console.log('A client disconnected. Total connections:', data.activeConnections);
				}
			}
		} else if (typeof data === 'string') {
			console.log('Received string data:', data);
			// Handle any remaining string messages if necessary
		}

		console.log('Updated messages:', $messages);
	}

	$effect(() => {
		console.log('is connected', isConnected, 'isVisible', isVisible);
		if (!isVisible) {
			console.log('closing event source, user tabbed away');
			eventSource?.close();
			eventSource = null;
		} else if (userTabbedAway) {
			console.log('user tabbed back, reconnecting');
			scheduleReconnect();
			userTabbedAway = false;
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
	const connectToStream = () => {
		eventSource = new EventSource('/api/sse');
		eventSource.onopen = () => {
			console.log('SSE connection opened');
			reconnectAttempts = 0;
			isConnected = true;
		};
		eventSource.onerror = (err) => {
			console.error('SSE connection error:', err);
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

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			clearInterval(pingInterval);
			if (eventSource) {
				eventSource.close();
			}
		};
	};
	onMount(() => {
		connectToStream();

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});
	const handleVisibilityChange = () => {
		isVisible = !document.hidden;
		console.log('is visible', !document.hidden);
		if (!isVisible) {
			userTabbedAway = true;
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
		if (!uiData.length) return 0;
		// @ts-ignore
		return uiData.find((v) => v.distance).distance;
	}
	function isWellRunning() {
		const resp = uiData.find((v) => 'state' in v && v.state === 'Well running') as
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
		const resp = uiData.find((v) => 'state' in v && v.state === 'Pressure running') as
			| PowerDoc
			| undefined;
		if (resp) {
			const formattedTime = resp.when.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit',
				hour12: true
			});
			return `<h4 style="background-color: rgba(173, 175, 204)">Well pump is on... started ${formattedTime}</h4>`;
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
	{#if uiData.length > 0}
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
							{#each uiData as r, i (i)}
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
					<WellReport groups={getWellRuntimeData(uiData)} />
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
