<script lang="ts">
	export let groups; // Declare the prop
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
</script>

<h3 class="center">Pumping Stats</h3>
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
	.center {
		text-align: center;
	}
	td {
		text-align: center;
	}
</style>
