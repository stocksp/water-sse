<script lang="ts">
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';
	import { store } from '$lib/uiData.svelte';

	async function getHistory() {
		const item = localStorage['history'];
		if (item) {
			let val = JSON.parse(item);
//console.log('history from storage before', val.fillSessions);
			val = val.fillSessions.map((doc: any) => {
				doc.when = new Date(doc.when);
				return doc;
			});
		//	console.log('history from storage after map', val);
			return {message: "ok", fillSessions: val}
		}
		const response = await fetch('/api/well-history');
		let history = await response.json();
		//console.log('history from api', history);
		let sessions = history.fillSessions.map((doc:any) => {
			doc.when = new Date(doc.when);
				return doc;
		})
		
		localStorage.setItem('history', JSON.stringify({message: "ok", fillSessions: sessions}));
		return {message: "ok", fillSessions: sessions};
	}
</script>

{#if store.getUiData.length > 0}
	<WellReport groups={getWellRuntimeData(store.getUiData)} title={"Pump Filling Stats"}/>

	{#await getHistory()}
		<p>Loading...</p>
	{:then history}
		<WellReport groups={history.fillSessions} title={"History Pump Filling Stats"}/>
	{:catch error}
		<p>{error.message}</p>
	{/await}
{:else}
	<div>NO Data, {store.getUiData.length}</div>
{/if}

<style>
</style>
