<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
  
	interface Message {
	  text: string;
	  activeConnections: number;
	}
  
	let messages: Message[] = [];
	let eventSource: EventSource;
	let connectionId: string | null = null;
  
	function parseMessage(data: string): Message {
	  const parts = data.split(' | ');
	  let text = data;
	  let activeConnections = 0;
  
	  if (parts.length === 2) {
		text = parts[0];
		const connectionsInfo = parts[1];
		activeConnections = parseInt(connectionsInfo.split(': ')[1], 10) || 0;
	  }
  
	  return { text, activeConnections };
	}
  
	function setupEventSource() {
	  eventSource = new EventSource('/api/sse');
  
	  eventSource.onmessage = (event) => {
		const message = parseMessage(event.data);
		messages = [...messages, message];
		
		if (!connectionId && message.text.includes('Connected. ID:')) {
		  connectionId = message.text.split('ID:')[1]?.split('.')[0]?.trim() || null;
		}
	  };
  
	  eventSource.onerror = () => {
		eventSource.close();
		setTimeout(setupEventSource, 5000); // Try to reconnect after 5 seconds
	  };
	}
  
	function ping() {
	  if (connectionId) {
		fetch('/api/sse', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ connectionId })
		});
	  }
	}
  
	onMount(() => {
	  setupEventSource();
  
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
  <ul>
	{#each messages as message}
	  <li>{message.text} {#if message.activeConnections > 0}(Active connections: {message.activeConnections}){/if}</li>
	{/each}
  </ul>
  