<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';

	import convertToPower from '$lib/convertToPower';

	import { store } from '$lib/uiData.svelte';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';

	let { children } = $props();

	let connectionId: string | null = null;
	let reconnectAttempts = 0;

	let isVisible = $state(true);
	let activeUrl = $derived($page.url.pathname);

	let eventSource: EventSource | null = null;
	let reconnectMaxDelay = 15000;

	let reconnectTimeout: NodeJS.Timeout | null = null;
	let pingInterval: NodeJS.Timeout | null = null;

	let isWellRunningHTML = $state('');
	let isPressureRunningHTML = $state('');

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
				const newData: UIData = convertToPower(data.data);
				store.setUiData(newData);
			} else if (data.message === 'new_data') {
				const newData: UIData = convertToPower(data.data);
				// We may have a "Pressure running" in currentData AND we are getting a "Pressure ran"
				// This requires that we remove this "Pressure running" from the display data as we only keep the
				// runTime for the pressure pump
				// First, remove any existing 'pressure running' entries
				const hasPressureRan = newData.some((doc) => 'pump' in doc && doc.pump === 'pressure' && doc.state === 'Pressure ran');
				if (hasPressureRan) {
					store.removeRunningPressurePump();
				}
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
	function stopConnection() {
		console.log('stopConnection called'); //ADDED DEBUG
		if (pingInterval) {
			clearInterval(pingInterval);
			pingInterval = null;
		}
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}
	}

	$effect(() => {
		console.log('EFFECT RUNNING: is connected', store.getIsConnected, 'isVisible', isVisible); //ADDED DEBUG
		if (!isVisible && store.getIsConnected) {
			console.log('closing event source, user tabbed away');
			stopConnection(); // Call a helper function for cleanup
			store.setIsConnected(false);
		} else if (!store.getIsConnected && isVisible) {
			console.log('user tabbed back or not connected, reconnecting');
			scheduleReconnect();
		}
	});
	$effect(() => {
		isWellRunningHTML = isWellRunning();
		isPressureRunningHTML = isPressureRunning();
	});
	const scheduleReconnect = () => {
		console.log('scheduleReconnect called'); //ADDED DEBUG
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
		console.log('connectToStream called'); //ADDED DEBUG
		stopConnection();
		console.log('Creating new EventSource...'); // ADDED DEBUG
		eventSource = new EventSource('/api/sse');

		eventSource.onopen = () => {
			console.log('SSE connection opened');
			reconnectAttempts = 0;
			store.setIsConnected(true);
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
				reconnectTimeout = null;
			}

			pingInterval = setInterval(() => {
				if (connectionId) {
					console.log('ping server:', connectionId);
					fetch('/api/sse', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ connectionId: connectionId })
					});
				}
			}, 20000);
		};

		eventSource.onerror = (err) => {
			console.error('SSE connection error:', err);
			store.setIsConnected(false);
			if (pingInterval) {
				clearInterval(pingInterval);
			}
			scheduleReconnect();
		};

		eventSource.onmessage = handleMessage;
	}
	onMount(() => {
		if (browser) {
			connectToStream();
			// Add event listener for visibility change
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}
	});

	onDestroy(() => {
		if (browser) {
			stopConnection(); //Call stopConnection on destroy
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	});
	const handleVisibilityChange = () => {
		if (browser) {
			isVisible = !document.hidden;
			console.log('is visible', isVisible);
		}
	};
	function currentDistance() {
		if (!store.getUiData.length) return 0;
		// @ts-ignore
		return store.getUiData.find((v) => v.distance).distance;
	}
	function isWellRunning() {
		const resp = store.getUiData.find((v) => 'state' in v && v.state === 'Well running') as PowerDoc | undefined;
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
		const resp = store.getUiData.find((v) => 'state' in v && v.state === 'Pressure running') as PowerDoc | undefined;
		if (resp) {
			const formattedTime = resp.when.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit',
				hour12: true
			});
			return `<h4 class="text-center" style="background-color: rgba(173, 175, 204)">Pressure pump is on... started ${formattedTime}</h4>`;
		}
		return '';
	}
</script>

<div class="app">
	<main>
		<Navbar>
			<NavHamburger />
			<NavUl {activeUrl}>
				<NavLi href="/" class="text-xl">Home</NavLi>
				<NavLi href="/well" class="text-xl">Well Report</NavLi>
				<NavLi href="/climate" class="text-xl">Climate Report</NavLi>
			</NavUl>
		</Navbar>
		<h1 class="text-center lg:text-4xl">
			<span class="tinyIcon">💦</span>
			<span class="mediumIcon">💦</span>
			💦Water Report💦
			<span class="mediumIcon">💦</span>
			<span class="tinyIcon">💦</span>
		</h1>
		{#if store.getUiData.length > 0}
			<h3 class="text-center lg:text-2xl">
				Current well distance <strong>{currentDistance()}</strong>{' '}
			</h3>
			<h3 class="text-center lg:text-xl">Active Connections now: {store.getActiveConnections}</h3>
			{@html isWellRunningHTML}
			{@html isPressureRunningHTML}
		{/if}

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
