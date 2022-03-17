import { connect } from 'worktop/ws';

import type { Bindings } from 'worktop/cfw';
import type { WebSocket } from 'worktop/cfw.ws';
import type { Durable, Model as M } from 'worktop/cfw.durable';

export abstract class Actor {
	DEBUG: boolean;

	constructor(state: Durable.State, bindings: Bindings) {
		if (this.setup) state.blockConcurrencyWhile(() => this.setup!(state, bindings));
		this.DEBUG = false;
	}

	setup?(state: Durable.State, bindings: Bindings): Promise<void> | void;
	onconnect?(req: Request, ws: WebSocket): Promise<void> | void;

	abstract receive(req: Request): Promise<Response> | Response;

	async connect(req: Request): Promise<Response> {
		let error = connect(req);
		if (error) return error;

		let { 0: client, 1: server } = new WebSocketPair;

		server.accept();

		function closer() {
			server.close();
		}

		server.addEventListener('close', closer);
		server.addEventListener('error', closer);

		if (this.onconnect) {
			await this.onconnect(req, server);
		}

		return new Response(null, {
			status: 101,
			statusText: 'Switching Protocols',
			webSocket: client,
		});
	}

	async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
		try {
			let request = new Request(input, init);
			return await this.receive(request);
		} catch (err) {
			let msg = this.DEBUG && (err as Error).stack;
			return new Response(msg || 'Error with receive', { status: 400 });
		}
	}
}

// interface Operations {
// 	get: Parameters<Durable.Storage['get']>;
// }

export class Model implements M {
	#ns: Durable.Namespace

	constructor(DONamespace: Durable.Namespace) {
		this.#ns = DONamespace;
	}

	async get(namespace:string, key: string|string[]) {
		const res = await this.fetchDurableObject(namespace, {
			op: 'get',
			keys: typeof key === 'string' ? [key] : key
		});
		return typeof key === 'string' ? res.result[key] : res.result;
	}

	async put<T>(namespace:string, key:string|Record<string, Object>, value: T, options = undefined) {
		const res = await this.fetchDurableObject(namespace, {
			op: 'put',
			entries: typeof key === 'string' ? {[key]: value} : key,
			options,
		});
		return res.success;
	}

	async delete(namespace:string, key:string|string[]) {
		const res = await this.fetchDurableObject(namespace, {
			op: 'delete',
			keys: typeof key === 'string' ? [key] : key,
		});
		return res.success;
	}

	async list(namespace:string, prefix='') {
		const res = await this.fetchDurableObject(namespace, {
			op: 'list',
			options: { prefix },
		});
		return res.success ? res.result : undefined;
	}

	// TODO, any & private
	async fetchDurableObject(namespace:string, body: any) {
		const stub = this.#ns.get(this.#ns.idFromName(namespace));

		// TODO retries
		const res = await stub.fetch('http://internal', {
			method: 'POST',
			body: JSON.stringify(body)
		});

		return res.json();
	}
}
