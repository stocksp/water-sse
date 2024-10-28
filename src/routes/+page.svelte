<script lang="ts">
	import { store } from '$lib/uiData.svelte';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';

	function makeTime(seconds: number) {
		return (seconds / 60).toFixed(1) + ' mins';
	}

	// $inspect(store.getUiData).with(() => {
	// 	console.log('uiData', store.getUiData.length);
	// });

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
	function getWhat(r: any) {
		return r.distance ? 'Distance' : r.state ? r.state : 'Voltage';
	}
	function doTd(r: any) {
		if (r.distance) {
			return r.distance;
		} else if (r.voltage) {
			return r.voltage;
		} else if (r.runTime) {
			return makeTime(r.runTime);
		} else if (r.state === 'Well running') {
			return r.state;
		} else {
			return '-----';
		}
	}
	const doFormat = (theDate: Date) => {
		// First convert the date to UTC string
		const utcDate = new Date(theDate).toUTCString();
		// Then create a new date from the UTC string and format it
		return new Date(utcDate).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			hour12: true
		});
	};
	function currentDistance() {
		if (!store.getUiData.length) return 0;
		// @ts-ignore
		return store.getUiData.find((v) => v.distance).distance;
	}
	function isWellRunning() {
		const resp = store.getUiData.find((v) => 'state' in v && v.state === 'Well running') as PowerDoc | undefined;
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
		const resp = store.getUiData.find((v) => 'state' in v && v.state === 'Pressure running') as PowerDoc | undefined;
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

{#if store.getUiData.length > 0}
	<Table>
		<TableHead>
			<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">What</TableHeadCell>
			<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">When</TableHeadCell>
			<TableHeadCell class="w-[150px] px-4 py-3 text-black md:font-extrabold">Dist / Time</TableHeadCell>
		</TableHead>

		<TableBody>
			{#each store.getUiData as r, i (i)}
				<TableBodyRow class={i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-900' : ''} style={getBGColor(r)}>
					<TableBodyCell class="px-4 py-2">{getWhat(r)}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{@html doFormat((r as unknown as PowerDoc | DistDoc).when)}</TableBodyCell>
					<TableBodyCell class="px-4 py-2">{doTd(r)}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{:else}
	<div>NO Data, {store.getUiData.length}</div>
{/if}

<style>
</style>
