import { pool } from '$lib/server/mysql';
import { json } from '@sveltejs/kit';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
	try {
		console.log('===>starting api climate');

		const now = new Date();
		const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [rows] = await pool.query<RowDataPacket[]>(
			`SELECT * 
       FROM climate 
       WHERE 'when' > ? 
       AND name IN ('Crawl Space', 'home', 'outside', 'Well Climate inside', 'Tank Climate inside') 
       ORDER BY id DESC`,
			[lastWeek]
		);
		console.log('===>found rows:', rows.length); // Log the number of rows found

		const climateDocs = rows.map((row) => ({
			name: row.name,
			when: row.when, 
			temperature: row.temperature,
			humidity: row.humidity,
			// ... other fields
		}));
		//console.log('===>climateDocs:', climateDocs); // Log the climateDocs array
		return json({ ok: 'ok', climateDocs });
	} catch (error) {
		let message;
		if (error instanceof Error) message = error.message;
		else message = String(error);
		console.error("Error:", message);
		return json({ ok: 'error', error: message }, { status: 500 }); // Return JSON with error
	}
}