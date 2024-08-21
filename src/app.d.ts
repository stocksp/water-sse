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

	interface WaterData {
		message: string;
		distDocs: DistDoc[];
		powerDocs: PowerDoc[];
		Error?: string;
	}

	interface Connection {
		controller: ReadableStreamDefaultController;
		lastPing: number;
	}
}

export {};
