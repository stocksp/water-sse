import { writable } from 'svelte/store';
function createStore() {
	const { subscribe, set, update } = writable({
	  uiData: [] as UIData[],
	  activeConnections: 0,
	  isConnected: false
	});
  
	return {
	  subscribe,
	  setUiData: (newData: UIData[] | ((currentData: UIData[]) => UIData[])) => update(store => {
		const updatedUiData = typeof newData === 'function' ? newData(store.uiData) : newData;
		return { ...store, uiData: updatedUiData };
	  }),
	  setActiveConnections: (v: number) => update(store => ({ ...store, activeConnections: v })),
	  setIsConnected: (v: boolean) => update(store => ({ ...store, isConnected: v })),
	  getUiData: () => {
		let data: UIData[] = [];
		subscribe(store => {
		  data = store.uiData;
		})();
		return data;
	  },
	  getActiveConnections: () => {
		let connections = 0;
		subscribe(store => {
		  connections = store.activeConnections;
		})();
		return connections;
	  },
	  getIsConnected: () => {
		let connected = false;
		subscribe(store => {
		  connected = store.isConnected;
		})();
		return connected;
	  }
	};
  }
  export const store = createStore();