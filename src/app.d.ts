// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	
	interface DistDocDb {
		distance: number;
		when: string;
	}
	interface DistDoc {
		distance: number;
		when: Date;
	}
	interface PowerDoc {
		state: string;
		when: Date;
		pump: string;
		runTime?: number;
	}
	type UIData = Array<PowerDoc | DistDoc>;
	interface PowerDocDb {
		state: string;
		when: string;
		pump: string;
		runTime?: number;
	}
	interface GroupItem {
		time: number;
		frags: string;
		sinceLastPump: number;
		when: Date;
		dists: string;
	  }

	interface WaterData {
		message: string;
		distDocs: DistDoc[];
		powerDocs: PowerDoc[];
		Error?: string;
	}
	interface WaterDataDb {
		message: string;
		distDocs: DistDocDb[];
		powerDocs: PowerDocDb[];
		Error?: string;
	}

	interface Connection {
		controller: ReadableStreamDefaultController;
		lastPing: number;
	}
	type Db = import('mongodb').Db; 
}

export {};
