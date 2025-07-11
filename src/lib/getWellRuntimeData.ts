interface TheDataItem {
	what: string;
	when: Date;
	dist: string | number;
}

function makeTime(seconds: number): string {
	return (seconds / 60).toFixed(1) + ' mins';
}

function differenceInHours(date1: Date, date2: Date): number {
	const diffMs = Math.abs(date2.getTime() - date1.getTime());
	return Math.floor(diffMs / (1000 * 60 * 60));
}

function differenceInMinutes(date1: Date, date2: Date): number {
	const diffMs = Math.abs(date2.getTime() - date1.getTime());
	return Math.floor(diffMs / (1000 * 60));
}

const getDistVal = (date: Date, arr: UIData): number => {
	const dists = arr
		.filter((item) => 'distance' in item)
		.sort((a, b) => Math.abs(date.getTime() - a.when.getTime()) - Math.abs(date.getTime() - b.when.getTime()));

	return dists.length > 0 ? dists[0].distance : 0;
};

const getWellRuntimeData = (d: UIData): GroupItem[] => {
	if (d.length === 0) return [];
	const theDists = d.filter((item) => 'distance' in item);

	//console.log('Input data length:', d.length);

	const theData: TheDataItem[] = d
		.map((r) => {
			const what = 'distance' in r ? 'Distance' : r.state;
			let dist: string | number;

			if ('distance' in r && typeof r.distance === 'number') {
				dist = r.distance;
			} else if ('runTime' in r && typeof r.runTime === 'number') {
				dist = makeTime(r.runTime);
			} else if ('state' in r && r.state === 'Well running') {
				dist = r.state;
			} else {
				dist = '-----';
			}

			return { what, when: r.when, dist };
		})
		.reverse(); // Reverse the data to process from newest to oldest

	let group: TheDataItem[] = [];
	let groups: TheDataItem[][] = [];

	theData.forEach((v, i, arr) => {
		if (!group.length) {
			if (v.what === 'Well starting') group.push(v);

			// if (v.when.toLocaleDateString() === '7/8/2025') {
			// 	console.log('starting new group well starting', v.when.toLocaleDateString());
			// }
		} else {
			if (v.what === 'Well starting') {
				const pumpSpan = 210;
				const previous = group[group.length - 1];
				const diff = differenceInMinutes(v.when, previous.when);

				//console.log('diff', diff, v.when.toLocaleTimeString(), previous.when.toLocaleTimeString());

				if (diff <= pumpSpan) {
					group.push(v);
					// if (v.when.toLocaleDateString() === '7/8/2025') {
					// 	console.log('adding to group', v.what, diff, parseFloat(previous.dist.toString()));
					// }
				} else {
					// if (v.when.toLocaleDateString() === '7/8/2025') {
					// 	console.log('ending group starting another', v.what, diff);
					// }

					groups.push(group);
					group = [];
					group.push(v);
				}
			}

			if (v.what === 'Well ran') {
				// if (v.when.toLocaleDateString() === '7/9/2025') {
				// 	console.log('starting new group Well ran', v.when.toLocaleDateString(), v.what);
				// }

				group.push(v);
			}
		}
	});

	// Add the last group if it's not empty
	if (group.length > 0) {
		groups.push(group);
	}

	// Reverse the groups to get them in chronological order
	groups.reverse();

	console.log('Number of groups:', groups.length);

	const finalGroups: GroupItem[] = groups.map((v, i, arr): GroupItem => {
		let time = v.filter((o) => o.what === 'Well ran').reduce((a, b) => a + parseFloat(b.dist.toString()), 0);
		time = Math.round(time * 10) / 10;

		let frags = v
			.filter((o) => o.what === 'Well ran')
			.map((o) => o.dist.toString().split(' ')[0])
			.join('+');

		// Truncate if longer than 100 characters
		if (frags.length > 100) {
			const parts = frags.split('+');
			frags = '';

			for (const part of parts) {
				const nextFragment = frags ? frags + '+' + part : part;
				if (nextFragment.length <= 100) {
					frags = nextFragment;
				} else {
					break;
				}
			}
		}

		const startDist = getDistVal(v[0].when, d);
		const endDist = getDistVal(v[v.length - 1].when, d);
		const distStr = `${startDist.toFixed(1)}-${endDist.toFixed(1)}`;
		// compare the start of this session with the end of the last
		const sinceLastPump = i < arr.length - 1 ? differenceInHours(v[0].when, arr[i + 1][arr[i + 1].length - 1].when) : 0;

		return {
			time,
			frags,
			sinceLastPump,
			when: v[v.length - 1].when,
			dists: distStr
		};
	});

	return finalGroups;
};

export default getWellRuntimeData;
