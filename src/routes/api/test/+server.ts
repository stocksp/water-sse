import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/mysql';
import type { RowDataPacket } from 'mysql2';
import { formatInTimeZone } from 'date-fns-tz'; // We'll need to install this

export async function GET() {
    try {
        // Get just the most recent climate record
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM climate 
             ORDER BY \`when\` DESC LIMIT 1`
        );

        if (rows.length === 0) {
            return json({ error: 'No data found' });
        }

        const record = rows[0];
        const rawDate = record.when;

        // Return various formats for comparison
        return json({
            rawMySQLDate: rawDate,
            rawISOString: rawDate.toISOString(),
            mysqlTimestamp: record.when,
            serverTime: new Date().toISOString(),
            dateFnsFormat: formatInTimeZone(
                rawDate,
                'America/Los_Angeles',
                'MMM d, h:mm:ss a'
            )
        });
    } catch (error) {
        console.error('Test route error:', error);
        return json({ error: String(error) }, { status: 500 });
    }
}