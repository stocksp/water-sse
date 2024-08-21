<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
  
	let messages: string[] = [];
	let eventSource: EventSource;
	let connectionId: string | null = null;
	let activeConnections: number = 0;
  
	function handleMessage(event: MessageEvent) {
    console.log('Received SSE message:', event.data);
    
    let data: any;
    try {
      data = JSON.parse(event.data);
      console.log('Successfully parsed JSON data:', data);
    } catch (error) {
      console.log('Failed to parse as JSON. Raw data:', event.data);
      console.log('Parse error:', error);
      data = event.data;
    }
    
    if (typeof data === 'object') {
      if (data.message === 'initial_data') {
        const waterData: WaterData = data.data;
        console.log('Received initial water data:', waterData);
        messages = [`distDocs: ${waterData.distDocs.length}, powerDocs: ${waterData.powerDocs.length}`];
      } else if (data.message === 'new_data') {
        const waterData: WaterData = data.data;
        console.log('Received new water data:', waterData);
        messages = [...messages, `distDocs: ${waterData.distDocs.length}, powerDocs: ${waterData.powerDocs.length}`];
      } else if (data.message === 'connection_status') {
        activeConnections = data.activeConnections;
        console.log('Updated active connections:', activeConnections);
        if (data.status === 'connected') {
          connectionId = data.id;
          console.log('Set connection ID:', connectionId);
        } else if (data.status === 'client_connected') {
          console.log('New client connected. Total connections:', activeConnections);
        } else if (data.status === 'client_disconnected') {
          console.log('A client disconnected. Total connections:', activeConnections);
        }
      }
    } else if (typeof data === 'string') {
      console.log('Received string data:', data);
      // Handle any remaining string messages if necessary
    }
    
    console.log('Updated messages:', messages);
  }
  
	onMount(() => {
	  eventSource = new EventSource('/api/sse');
	  eventSource.onmessage = handleMessage;
  
	  // Ping the server every 20 seconds to keep the connection alive
	  const pingInterval = setInterval(() => {
		if (connectionId) {
		  fetch('/api/sse', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ connectionId })
		  });
		}
	  }, 20000);
  
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
  