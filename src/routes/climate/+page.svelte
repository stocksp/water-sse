<script lang="ts">
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { Radio } from 'flowbite-svelte';

	let filter = $state('all');

	const filterData = (data: any) => {
		if (filter === 'all') {
			return data;
		} else {
			return data.filter((r: any) => r.name === filter);
		}
	};

	async function getClimate() {
		const response = await fetch('/api/climate');
		let climate = await response.json();
		console.log('climate', climate);
		return climate;
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
	const doFormat = (theDate: Date) => {
		const realDate = new Date(theDate);
		const options = {
			month: 'short' as 'short' | 'numeric' | '2-digit' | 'long' | 'narrow',
			day: 'numeric' as 'numeric' | '2-digit',
			hour: 'numeric' as 'numeric' | '2-digit',
			minute: 'numeric' as 'numeric' | '2-digit',
			second: 'numeric' as 'numeric' | '2-digit',
			hour12: true
		};

		return realDate.toLocaleString('en-US', options);
	};
</script>

<h1 class="text-center lg:text-2xl">Local Climate news!</h1>
{#await getClimate()}
	<p>Loading...</p>
{:then data}
	
	<div class="flex space-x-4  mx-auto">
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
			{#each filterData(data.climateDocs) as r, i (i)}
				<TableBodyRow class={i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-900' : ''} style={getBGColor(r)}>
					<TableBodyCell class="px-4 py-2">{r.name}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{r.temperature}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{r.humidity}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{doFormat(r.when)}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{:catch error}
	<p>{error.message}</p>
{/await}
