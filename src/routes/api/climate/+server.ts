import { getDb } from '$lib/server/mongo';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		console.log('===>starting api climate');

		const db = await getDb();
		// find last history
		const climateDocs = await db
			.collection('climate')
			.find({
				when: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
				$or: [
					{ name: 'Crawl Space' },
					{ name: 'home' },
					{ name: 'outside' },
					{ name: 'Well Climate inside' }
				]
			})
			.project({ _id: 0 })
			.sort({ _id: -1 })
			.toArray();

		//console.log('found', climateDocs.length, climateDocs[0].when);
		return json({ ok: 'ok', climateDocs });
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);
		return 'Error: ' + message;
	}
}
