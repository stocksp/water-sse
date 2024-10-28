<script lang="ts">
    import { onMount } from 'svelte';
    import { formatInTimeZone } from 'date-fns-tz';

    let testData: any = null;
    let localFormatted: string = '';

    onMount(async () => {
        const response = await fetch('/api/test');
        testData = await response.json();
        
        // Format the date client-side for comparison
        if (testData?.rawISOString) {
            localFormatted = formatInTimeZone(
                new Date(testData.rawISOString),
                'America/Los_Angeles',
                'MMM d, h:mm:ss a'
            );
        }
    });
</script>

<div class="p-4">
    <h1 class="text-xl font-bold mb-4">Date/Time Test Page</h1>
    
    {#if testData}
        <div class="space-y-2">
            <p>Raw MySQL Date: {testData.rawMySQLDate}</p>
            <p>Raw ISO String: {testData.rawISOString}</p>
            <p>MySQL Timestamp: {testData.mysqlTimestamp}</p>
            <p>Server Time: {testData.serverTime}</p>
            <p>Date-fns Server Format: {testData.dateFnsFormat}</p>
            <p>Date-fns Client Format: {localFormatted}</p>
        </div>
    {/if}
</div>