import type { ServerRequest, Params } from 'worktop/request';

declare global {
	const WebSocketPair: {
		new(): {
			/** the `client` socket */
			0: WebSocket,
			/** the `server` socket */
			1: WebSocket,
		};
	};

	interface ResponseInit {
		webSocket?: WebSocket;
	}
}

export interface WebSocket {
	accept(): void;
	close(code?: number, reason?: string): void;

	// TODO: Check if ArrayBuffer / ReadableStream works
	send(message: number | string): void;

	addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any): void;
	addEventListener(type: string, listener: EventListener): void;
}

type Context = Record<string, any>;
export interface Socket<D extends string = string, C = Context> {
	send: WebSocket['send'];
	close: WebSocket['close'];
	context: C;
	data: D;
}

export type MessageHandler<P extends Params = Params> = (req: ServerRequest<P>, socket: Socket) => Promise<void>|void;

/**
 * Ensure the incoming `Request` can be upgraded to a Websocket connection.
 * @NOTE This is called automatically within the `listen()` method.
 */
export const connect: Handler;

/**
 * Establish a Websocket connection.
 * Attach the `handler` as the 'message' event listener.
 * @NOTE Invokes the `connect()` middleware automatically.
 */
export function listen(handler: MessageHandler): Handler;
