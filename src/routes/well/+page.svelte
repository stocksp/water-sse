<script lang="ts">
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';
	import { store } from '$lib/uiData.svelte';

	async function getHistory() {
		const item = localStorage['history'];
		if (item) {
			let val = JSON.parse(item);
			val = val.fillSessions.map((doc: any) => {
				doc.when = new Date(doc.when);
				return doc;
			});

			// Check if the first element is older than 7 days
			const oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

			// If data is fresh (less than 7 days old), return it
			if (val.length > 0 && val[0].when > oneWeekAgo) {
				return { message: 'ok', fillSessions: val };
			}
			// If data is older than 7 days, continue to API call
		}
		console.log('updating well fill history!');
		// Fetch new data from API
		const response = await fetch('/api/well-history');
		let history = await response.json();
		let sessions = history.fillSessions.map((doc: any) => {
			doc.when = new Date(doc.when);
			return doc;
		});

		localStorage.setItem('history', JSON.stringify({ message: 'ok', fillSessions: sessions }));
		return { message: 'ok', fillSessions: sessions };
	}
</script>

{#if store.getUiData.length > 0}
	<WellReport groups={getWellRuntimeData(store.getUiData)} title={'Pump Filling Stats'} />

	{#await getHistory()}
		<p>Loading...</p>
	{:then history}
		<WellReport groups={history.fillSessions} title={'History Pump Filling Stats'} />
	{:catch error}
		<p>{error.message}</p>
	{/await}
{:else}
	<div>NO Data, {store.getUiData.length}</div>
{/if}

<style>
</style>
