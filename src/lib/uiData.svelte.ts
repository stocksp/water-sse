export function createStore() {
let uiData = $state<UIData[]>([]);
let activeConnections = $state<number>(0)
let isConnected = $state(false);
  return {
	getUiData () {
		return uiData;
	},
	setUiData (v: UIData[]) {
		uiData = v;
	},
	getActiveConnections () {
		return activeConnections;
	},
	setActiveConnections (v: number) {
		activeConnections = v;
	},
	getIsConnected () {
		return isConnected;
	},
	setIsConnected (v: boolean) {
		isConnected = v;
	}

  };
}

