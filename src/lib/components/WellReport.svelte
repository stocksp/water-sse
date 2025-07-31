<script lang="ts">
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';

	import { page } from '$app/stores';
	import { store } from '$lib/uiData.svelte';

	let { groups, title }: { groups: GroupItem[]; title: string } = $props();
	
	const doFormat = (theDate: Date) => {
		const options = {
			month: 'short' as const,
			day: 'numeric' as const,
			hour: 'numeric' as const,
			minute: 'numeric' as const,
			second: 'numeric' as const,
			hour12: true,
			timeZone: 'America/Los_Angeles' // Force Pacific time
		};

		return new Date(theDate).toLocaleString('en-US', options);
	};
	//$inspect(groups)
</script>

<h1 class="text-center lg:text-2xl">{title}</h1>
<Table>
	<TableHead>
		<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">Time</TableHeadCell>
		<TableHeadCell class="w-[250px] px-4 py-3 text-black md:font-extrabold">Fragments</TableHeadCell>
		<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">Start-End</TableHeadCell>
		<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">Hours<br /> since</TableHeadCell>
		<TableHeadCell class="w-[200px] px-4 py-3 text-black md:font-extrabold">When ended</TableHeadCell>
	</TableHead>

	<TableBody>
		{#each groups as r, i (i)}
			<TableBodyRow class={i % 2 === 0 ? 'text-black bg-gray-100 dark:bg-gray-900' : 'text-black'} >
				<TableBodyCell class="px-4 py-2">{r.time}</TableBodyCell>
				<TableBodyCell class="px-4 py-2">{r.frags}</TableBodyCell>
				<TableBodyCell class="px-4 py-2">{r.dists}</TableBodyCell>
				<TableBodyCell class="px-4 py-2">{r.sinceLastPump}</TableBodyCell>
				<TableBodyCell class="px-4 py-2">{doFormat(r.when)}</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>

<style>
</style>
