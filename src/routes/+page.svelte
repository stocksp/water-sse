<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
  
	let messages: string[] = [];
	let eventSource: EventSource;
	let connectionId: string | null = null;
	let activeConnections: number = 0;
  
	function ping() {
	  if (connectionId) {
		fetch('/api/sse', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ connectionId })
		});
	  }
	}
  
	function handleMessage(event: MessageEvent) {
	  let data: any;
	  try {
		data = JSON.parse(event.data);
	  } catch {
		// If it's not JSON, use the raw data
		data = event.data;
	  }
	  
	  if (typeof data === 'object' && (data.message === 'new_data' || data.message === 'initial_data')) {
		const waterData: WaterData = data.data;
		messages = [...messages, `distDocs: ${waterData.distDocs.length}, powerDocs: ${waterData.powerDocs.length}`];
	  } else if (typeof data === 'string') {
		if (data.includes('Active connections:')) {
		  activeConnections = parseInt(data.split('Active connections:')[1].trim(), 10);
		} else if (data.includes('Connected. ID:')) {
		  connectionId = data.split('ID:')[1].split('.')[0].trim();
		}
		// We're not adding these messages to the messages array anymore
	  }
	}
  
	onMount(() => {
	  eventSource = new EventSource('/api/sse');
	  eventSource.onmessage = handleMessage;
  
	  // Ping the server every 20 seconds to keep the connection alive
	  const pingInterval = setInterval(ping, 20000);
  
	  return () => {
		clearInterval(pingInterval);
	  };
	});
  
	onDestroy(() => {
	  if (eventSource) {
		eventSource.close();
	  }
	});
  </script>
  
  <h1>SSE Messages</h1>
  <h3>Active Connections: {activeConnections}</h3>
  <ul>
	{#each messages as message}
	  <li>{message}</li>
	{/each}
  </ul>
  