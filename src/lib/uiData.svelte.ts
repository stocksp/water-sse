export function createStore() {
let uiData = $state<UIData[]>([]);
  return {
	get () {
		return uiData;
	},
	set (v: UIData[]) {
		uiData = v;
	}

  };
}

