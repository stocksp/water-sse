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
             WHERE \`when\` > ? 
             AND name IN ('Crawl Space', 'home', 'outside', 'Well Climate inside', 'Tank Climate inside') 
             ORDER BY id DESC`,
            [lastWeek]
        );

        const climateDocs = rows.map((row) => ({
            name: row.name,
            when: row.when, // Keep the original date
            temperature: row.temperature,
            humidity: row.humidity,
        }));

        console.log('Raw date from DB:', climateDocs[0]?.when);
        return json({ ok: 'ok', climateDocs });
    } catch (error) {
        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error);
        console.error("Error:", message);
        return json({ ok: 'error', error: message }, { status: 500 });
    }
}
