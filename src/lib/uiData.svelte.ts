function createStore() {
	let uiData = $state<UIData>([]);
	let activeConnections = $state<number>(0);
	let isConnected = $state(false);
	return {
		get getUiData() {
			return uiData;
		},
		setUiData: (newData: UIData | ((currentData: UIData) => UIData)) =>{
			const updatedUiData = typeof newData === 'function' ? newData(uiData) : newData;
			uiData = updatedUiData;
			console.log('setting uiData', uiData.length)
		},
		// this is used during SSE update where the pressure pump goes off and
		// we need to remove the 'pressure running' item
        removeRunningPressurePump() {
            uiData = uiData.filter(doc => {
                // Check if it's a PowerDoc (by checking if it has the 'pump' property)
                if ('pump' in doc) {
                    // Return true to keep all documents that DON'T match our removal criteria
                    return !(doc.pump === 'pressure' && doc.state === 'Pressure running');
                }
                // Keep all DistDoc entries
                return true;
            });
        },
		get getActiveConnections() {
			return activeConnections;
		},
		setActiveConnections(v: number) {
			activeConnections = v;
		},
		get getIsConnected() {
			return isConnected;
		},
		setIsConnected(v: boolean) {
			isConnected = v;
		}
	};
}
export const store = createStore();
