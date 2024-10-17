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
