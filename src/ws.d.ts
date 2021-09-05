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
	send(message: number | string): void;
	close(code?: number, reason?: string): void;
	addEventListener(type: 'error', listener: (this: WebSocket, ev: Event) => any): void;
	addEventListener(type: 'close', listener: (this: WebSocket, ev: CloseEvent) => any): void;
	addEventListener(type: 'message', listener: (this: WebSocket, ev: MessageEvent<string>) => any): void;
}

type Context = Record<string, any>;
export interface Socket<C extends Context = Context> {
	send: WebSocket['send'];
	close: WebSocket['close'];
	context: C;
	event:
		| { type: 'close' } & CloseEvent
		| { type: 'message' } & MessageEvent<string>
		| { type: 'error' } & Event;
}

export type SocketHandler<
	P extends Params = Params,
	C extends Context = Context,
> = (req: ServerRequest<P>, socket: Socket<C>) => Promise<void>|void;

/**
 * Ensure the incoming `Request` can be upgraded to a Websocket connection.
 * @NOTE This is called automatically within the `listen()` method.
 */
export function connect<P extends Params = Params>(req: ServerRequest<P> | Request): Response | void;

/**
 * Establish a Websocket connection.
 * Attach the `handler` as the 'message' event listener.
 * @NOTE Invokes the `connect()` middleware automatically.
 */
export function listen<
	P extends Params = Params,
	C extends Context = Context,
>(handler: SocketHandler<P, C>): (req: ServerRequest<P>) => Response;
