<script lang="ts">
	
	import getWellRuntimeData from '$lib/getWellRuntimeData';
	import WellReport from '$lib/components/WellReport.svelte';
	import { store } from '$lib/uiData.svelte';
	import * as Table from '$lib/components/ui/table/index.js';


	//let uiData = $state(store.getUiData());
	//let theData = $state(store.getUiData());
	function makeTime(seconds: number) {
		return (seconds / 60).toFixed(1) + ' mins';
	}
	/* $effect(() => {
		console.log(theData)
	}) */
	//$inspect(uiData).with(() => { console.log('uiData',uiData.length) });

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
			<Table.Root>
				<Table.Caption>Well Height</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[150px] px-4 py-3 text-black md:font-extrabold">What</Table.Head>
						<Table.Head class="w-[150px] px-4 py-3 text-black md:font-extrabold">When</Table.Head>
						<Table.Head class="w-[150px] px-4 py-3 text-black md:font-extrabold">Dist / Time</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each store.getUiData as r, i (i)}
						<Table.Row  style={getBGColor(r)}>
							<Table.Cell class="px-4 py-2">{getWhat(r)}</Table.Cell>
							<Table.Cell class="px-4 py-2">{@html doFormat((r as unknown as PowerDoc | DistDoc).when)}</Table.Cell>
							<Table.Cell class="px-4 py-2">{doTd(r)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			<!-- <h3 class="center">Well Height</h3>
					<table>
						<thead>
							<tr>
								<th>What</th>
								<th>When</th>
								<th>Dist <br /> Time</th>
							</tr>
						</thead>
						<tbody>
							{#each store.getUiData() as r, i (i)}
								<tr style={getBGColor(r)}>
									<td>{getWhat(r)}</td>
									<td>{@html doFormat((r as unknown as PowerDoc | DistDoc).when)}</td>
									<td>{doTd(r)}</td>
								</tr>
							{/each}
						</tbody>
					</table> -->

			<!-- <div class="column">
					<WellReport groups={getWellRuntimeData(store.getUiData())} />
				</div> -->
		</div>
	{:else}
		<div>NO Data, {store.getUiData.length}</div>
	{/if}
</div>

<style>
	
</style>
