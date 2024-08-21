// getWaterData.ts
import { getDb } from '$lib/server/mongo';

export const getWaterData = async (lookBackTime: Date): Promise<WaterData> => {
	try {
		console.log(
			'starting getGetWaterData!',
			new Date().toLocaleString(),
			'from',
			lookBackTime.toLocaleString()
		);
		const db = await getDb();

		const distDocs = (await db
			.collection('waterDistance')
			.find({ when: { $gt: lookBackTime } })
			.project({ _id: 0 })
			.sort({ _id: -1 })
			.toArray()) as DistDoc[];

		const powerDocs = (await db
			.collection('power')
			.find({
				when: { $gt: lookBackTime }
			})
			.project({ _id: 0 })
			.sort({ _id: -1 })
			.toArray()) as PowerDoc[];

		console.log('found', distDocs.length, powerDocs.length, formatDate(Date.now()));
		return { message: 'ok', distDocs, powerDocs };
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);
		console.log('bad news in mongo', message);
		return { message: 'error', distDocs: [], powerDocs: [], Error: message };
	}
};
const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: true
	};

	return new Intl.DateTimeFormat('en-US', options).format(date);
};
