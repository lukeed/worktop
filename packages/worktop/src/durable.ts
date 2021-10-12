import { connect } from 'worktop/ws';
import type { Bindings } from 'worktop';
import type { WebSocket } from 'worktop/ws';
import type { Durable } from 'worktop/durable';

export abstract class Actor {
	DEBUG: boolean;

	constructor(state: Durable.State, bindings: Bindings) {
		if (this.setup) state.blockConcurrencyWhile(this.setup(state, bindings));
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
