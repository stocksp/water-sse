<script lang="ts">
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';
	import { store } from '$lib/uiData.svelte';
	import * as Table from '$lib/components/ui/table/index.js';

	function currentDistance() {
		if (!store.getUiData.length) return 0;
		// @ts-ignore
		return store.getUiData.find((v) => v.distance).distance;
	}
	function isWellRunning() {
		const resp = store.getUiData.find((v) => 'state' in v && v.state === 'Well running') as
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
		const resp = store.getUiData.find((v) => 'state' in v && v.state === 'Pressure running') as
			| PowerDoc
			| undefined;
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

<h1>SSE Messages</h1>
<h3>Active Connections: {store.getActiveConnections}</h3>
<div>
	<h1 class="text-center text-xl">
		<span class="tinyIcon">💦</span>
		<span class="mediumIcon">💦</span>
		💦Water Report💦
		<span class="mediumIcon">💦</span>
		<span class="tinyIcon">💦</span>
	</h1>
	{#if store.getUiData.length > 0}
		<div>
			<h3 class="text-center text-xl">
				Current well distance <strong>{currentDistance()}</strong>{' '}
			</h3>
			{@html isWellRunning()}
			{@html isPressureRunning()}

			<WellReport groups={getWellRuntimeData(store.getUiData)} />
		</div>
	{:else}
		<div>NO Data, {store.getUiData.length}</div>
	{/if}
</div>

<style>
</style>
