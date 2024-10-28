<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { Radio, Button } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { formatInTimeZone } from 'date-fns-tz';

	let filter = $state('all');

	const filterData = (data: any) => {
		if (filter === 'all') {
			return data;
		} else {
			return data.filter((r: any) => r.name === filter);
		}
	};
	function reloadPage() {
		getClimate();
	}
	onMount(() => {
		getClimate();
	});

	let climateData = $state([]);

	async function getClimate() {
		climateData = [];
		try {
			const response = await fetch('/api/climate');
			if (!response.ok) {
				// Check if the response was successful
				const errorData = await response.json();
				console.error('Error fetching climate data:', errorData.error);
				// Handle the error (e.g., display an error message to the user)
				return; // Or throw an error to stop further processing
			}

			const data = await response.json();
			console.log('climate', data.climateDocs.length, data.climateDocs[0].when);
			climateData = data.climateDocs;
		} catch (error) {
			console.error('Error fetching climate data:', error);
			// Handle the error (e.g., display a generic error message)
		}
	}
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
	const doFormat = (theDate: Date | string) => {
		// Ensure we're treating the input as UTC
		const utcString = typeof theDate === 'string' ? theDate : theDate.toISOString();

		return formatInTimeZone(utcString, 'America/Los_Angeles', 'MMM d, h:mm:ss a');
	};
</script>

<h1 class="text-center lg:text-2xl">
	Local Climate news! &nbsp &nbsp<span><Button onclick={reloadPage} size="xs" color="blue" pill>Refresh</Button> </span>
</h1>
{#if climateData.length == 0}
	<p>Loading...</p>
{:else}
	<div class="mx-auto flex space-x-4">
		<span class="text-lg">Select what you want</span>
		<Radio bind:group={filter} value="all" class="text-lg">All</Radio>
		<Radio bind:group={filter} value="Crawl Space" class="text-lg">Crawl Space</Radio>
		<Radio bind:group={filter} value="outside" class="text-lg">Outside</Radio>
		<Radio bind:group={filter} value="Well Climate inside" class="text-lg">Well Climate inside</Radio>
	</div>
	<Table>
		<TableHead>
			<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">Where</TableHeadCell>
			<TableHeadCell class="w-[250px] px-4 py-3 text-black md:font-extrabold">Temperature</TableHeadCell>
			<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">Humidity</TableHeadCell>
			<TableHeadCell class="w-[200px] px-4 py-3 text-black md:font-extrabold">When</TableHeadCell>
		</TableHead>

		<TableBody>
			{#each filterData(climateData) as r, i (i)}
				<TableBodyRow class={i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-900' : ''} style={getBGColor(r)}>
					<TableBodyCell class="px-4 py-2">{r.name}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{r.temperature}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{r.humidity}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{doFormat(r.when)}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}
