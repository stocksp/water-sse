<script lang="ts">
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';
	import { store } from '$lib/uiData.svelte';
	import { page } from '$app/stores';
	
	
</script>

{#if store.getUiData.length > 0}
	<WellReport groups={getWellRuntimeData(store.getUiData)} />
{:else}
	<div>NO Data, {store.getUiData.length}</div>
{/if}

<style>
</style>
