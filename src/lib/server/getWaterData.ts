// getWaterData.ts
import { pool } from '$lib/server/mysql';
import type { RowDataPacket } from 'mysql2';

export const getWaterData = async (lookBackTime: Date): Promise<WaterData> => {
    try {
        console.log(
            'starting getGetWaterData sql!',
            new Date().toLocaleString(),
            'from',
            lookBackTime.toLocaleString()
        );

        // Get water distance data
        const [distRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, distance, \`when\` 
             FROM waterDistance 
             WHERE \`when\` > ? 
             ORDER BY id DESC`,
            [lookBackTime]
        );

        // Get power data
        const [powerRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, pump, state, \`when\`, runTime 
             FROM power 
             WHERE \`when\` > ? 
             ORDER BY id DESC`,
            [lookBackTime]
        );

        // Convert rows to your document format
        const distDocs = distRows.map(row => ({
            when: row.when,
            distance: row.distance
        }));

        const powerDocs = powerRows.map(row => ({
            when: row.when,
            pump: row.pump,
            state: row.state,
            runTime: row.runTime
        }));

        console.log('found', distDocs.length, powerDocs.length, formatDate(Date.now()));
        return { message: 'ok', distDocs, powerDocs };

    } catch (error) {
        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error);
        console.log('bad news in mysql', message);
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