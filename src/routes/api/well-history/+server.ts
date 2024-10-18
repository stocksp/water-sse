import { getDb } from '$lib/server/mongo';
import convertToPower from '$lib/convertToPower';
import getWellRuntimeData from '$lib/getWellRuntimeData';
import { json } from '@sveltejs/kit'

interface TheDataItem {
	what: string;
	when: Date;
	dist: string | number;
}

export async function GET() {
	try {
		console.log('===>starting getPumpHistory new one');

		const db = await getDb();
		// find last history
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90); // make it 90 days back!!
		console.log('today', new Date(), 'ninetyDaysAgo', ninetyDaysAgo)
		const hist = (await db
			.collection('wellHistory')
			.find({ when: { $gte: ninetyDaysAgo } })
			.project({ _id: 0 })
			.sort({ when: -1 })
			.toArray()) as GroupItem[];
		console.log(`history length: ${hist.length}`);
		if (hist.length == 0) {
			console.log('ninetyDaysAgo right before call', ninetyDaysAgo)
			const groups = await getData(db, ninetyDaysAgo);
			console.log(`groups length: ${groups.length} ${groups[0].when}`);
			const resp = await db.collection('wellHistory').insertMany(groups);
			console.log('groups 1', groups[0])
			return json( { message: 'ok', fillSessions: groups });
		} else {
			//TODO activate this with a look back of 30 days if history older than that
			// then update it!
			//console.log('history', hist)
			/* console.log('ninetyDaysAgo right before call', ninetyDaysAgo)
			const newGroups = await getData(db, hist[0].when);
			if (newGroups.length === 0) {
				return json({ message: 'ok', fillSessions: hist });
			}
			console.log(`group length ${newGroups.length}, ${newGroups[0].sinceLastPump}`)
			let resp = await db.collection('wellHistory').insertMany(newGroups);
			return json({ message: 'ok', fillSessions: newGroups.concat(hist) }); */
			return json({ message: 'ok', fillSessions: hist })
		}
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);
		return 'Error: ' + message;
	}
}

const getData = async (db: Db, date: Date) => {
	console.log('date is', date)
	const distDocs = (await db
		.collection('waterDistance')
		.find({ when: { $gt: date } })
		.project({ _id: 0 })
		.sort({ _id: -1 })
		.toArray()) as DistDoc[];
		console.log('dist docs length', distDocs.length)
	let powerDocs = (await db
		.collection('power')
		.find({
			when: { $gt: date }
		})
		.project({ _id: 0 })
		.sort({ _id: -1 })
		.toArray())as PowerDoc[];

	const uiData: UIData = convertToPower({ distDocs, powerDocs });
	console.log('===>before getwellRuntimeData', uiData )
	return getWellRuntimeData(uiData);
};
