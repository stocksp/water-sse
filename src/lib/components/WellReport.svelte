<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { page } from '$app/stores';
	import { store } from '$lib/uiData.svelte';

	let { groups }: { groups: GroupItem[] } = $props();
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
	$inspect(groups)
</script>

<h1 class="text-center lg:text-2xl">Pump Filling Stats</h1>
<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-[150px] px-4 py-3 text-black md:font-extrabold">Time</Table.Head>
			<Table.Head class="w-[250px] px-4 py-3 text-black md:font-extrabold">Fragments</Table.Head>
			<Table.Head class="w-[150px] px-4 py-3 text-black md:font-extrabold">Start-End</Table.Head>
			<Table.Head class="w-[150px] px-4 py-3 text-black md:font-extrabold"
				>Hours<br /> since</Table.Head
			>
			
			<Table.Head class="w-[200px] px-4 py-3 text-black md:font-extrabold">When ended</Table.Head>
		</Table.Row>
	</Table.Header>

	<Table.Body>
		{#each groups as r, i (i)}
			<Table.Row class={i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-900' : ''} style={getBGColor(r)}>
				<Table.Cell class="px-4 py-2">{r.time}</Table.Cell>
				<Table.Cell class="px-4 py-2">{r.frags}</Table.Cell>
				<Table.Cell class="px-4 py-2">{r.dists}</Table.Cell>
				<Table.Cell class="px-4 py-2">{r.sinceLastPump}</Table.Cell>
				<Table.Cell class="px-4 py-2">{doFormat(r.when)}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
<table>
	<thead>
		<tr>
			<th>Time</th>
			<th>Fragments</th>
			<th>Start-End</th>
			<th>Hours<br /> since</th>
			<th>When ended</th>
		</tr>
	</thead>
	<tbody>
		{#each groups as r, i (i)}
			<tr style={getBGColor(r)}>
				<td>{r.time}</td>
				<td>{r.frags}</td>
				<td>{r.dists}</td>
				<td>{r.sinceLastPump}</td>
				<td>{doFormat(r.when)}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	
</style>
