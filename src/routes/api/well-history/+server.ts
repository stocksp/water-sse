import { pool } from '$lib/server/mysql';
import convertToPower from '$lib/convertToPower';
import getWellRuntimeData from '$lib/getWellRuntimeData';
import { json } from '@sveltejs/kit';
import type { RowDataPacket } from 'mysql2';
import type { RequestHandler } from './$types';

interface TheDataItem {
    what: string;
    when: Date;
    dist: string | number;
}

interface GroupItem {
    when: Date;
    dists: string;
    frags: string;
    sinceLastPump: number;
    time: number;
}

export const GET: RequestHandler = async () => {
    try {
        console.log('===>starting getPumpHistory new one');

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        console.log('today', new Date(), 'ninetyDaysAgo', ninetyDaysAgo);

        const [histRows] = await pool.query<RowDataPacket[]>(
            `SELECT 'when', dists, frags, sinceLastPump, time 
             FROM wellHistory 
             WHERE 'when' >= ? 
             ORDER BY 'when' DESC`,
            [ninetyDaysAgo]
        );

        const hist = histRows.map(row => ({
            when: row.when,
            dists: row.dists,
            frags: row.frags,
            sinceLastPump: row.sinceLastPump,
            time: row.time
        }));

        console.log(`history length: ${hist.length}`);
        
        if (hist.length == 0) {
            const groups = await getData(ninetyDaysAgo);
            
            if (groups.length > 0) {
                const insertValues = groups.map(group => [
                    group.when,
                    group.dists,
                    group.frags,
                    group.sinceLastPump,
                    group.time
                ]);

                await pool.query(
                    `INSERT INTO wellHistory ('when', dists, frags, sinceLastPump, time) 
                     VALUES ?`,
                    [insertValues]
                );

                return json({ message: 'ok', fillSessions: groups });
            }
            return json({ message: 'ok', fillSessions: [] });
        } else {
            const mostRecentHistoryDate = new Date(hist[0].when);
            console.log('Most recent history date:', mostRecentHistoryDate);

            const newGroups = await getData(mostRecentHistoryDate);
            
            if (newGroups.length > 0) {
                console.log('Found new groups:', newGroups.length, 'First new group:', newGroups[0]);
                
                const insertValues = newGroups.map(group => [
                    group.when,
                    group.dists,
                    group.frags,
                    group.sinceLastPump,
                    group.time
                ]);

                await pool.query(
                    `INSERT INTO wellHistory ('when', dists, frags, sinceLastPump, time) 
                     VALUES ?`,
                    [insertValues]
                );

                return json({ message: 'ok', fillSessions: newGroups.concat(hist) });
            }

            return json({ message: 'ok', fillSessions: hist });
        }
    } catch (error) {
        console.error('Error in GET:', error);
        return json(
            { message: 'error', error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
};
const getData = async (date: Date) => {
    try {
        console.log('getData starting with date:', date.toLocaleString());

        // Get water distance data
        const [distRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, distance, 'when' 
             FROM waterDistance 
             WHERE 'when' > ? 
             ORDER BY id DESC`,
            [date]
        );

        const distDocs = distRows.map(row => ({
            when: row.when,
            distance: row.distance
        }));

        console.log('dist docs found:', distDocs.length);

        // Get power data
        const powerLookback = new Date(date.getTime() - (60 * 60 * 1000));
        const [powerRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, pump, state, 'when', runTime 
             FROM power 
             WHERE 'when' > ? 
             ORDER BY id DESC`,
            [powerLookback]
        );

        const powerDocs = powerRows.map(row => ({
            when: row.when,
            pump: row.pump,
            state: row.state,
            runTime: row.runTime
        }));

        console.log('power docs found:', powerDocs.length);

        // Convert the data - this now returns an array
        const combinedData = convertToPower({ distDocs, powerDocs });
        
        if (!Array.isArray(combinedData)) {
            console.error('convertToPower did not return an array');
            return [];
        }

        console.log('Combined data length:', combinedData.length);

        // Pass the combined array directly to getWellRuntimeData
        const runtimeData = getWellRuntimeData(combinedData);
        
        console.log('Runtime data length:', runtimeData?.length);

        return runtimeData || [];
    } catch (error) {
        console.error('Error in getData:', error);
        return [];
    }
};