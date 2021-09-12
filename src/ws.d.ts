import type { Context, Params } from 'worktop';
import type { OmitIndex, Promisable } from 'worktop/utils';

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

type State = Record<string, any>;
export interface Socket<S extends State = State> {
	send: WebSocket['send'];
	close: WebSocket['close'];
	state: S; // todo: not happy w/ name
	event:
		| { type: 'close' } & CloseEvent
		| { type: 'message' } & MessageEvent<string>
		| { type: 'error' } & Event;
}

export type SocketHandler<
	C extends Context = Context,
	P extends Params = Params,
	S extends State = State,
> = (
	request: Request,
	context: C, // todo: omit
	socket: Socket<S>
) => Promisable<void>;

/**
 * Ensure the incoming `Request` can be upgraded to a Websocket connection.
 * @NOTE This is called automatically within the `listen()` method.
 */
export function connect(req: Request): Response | void;

/**
 * Establish a Websocket connection.
 * Attach the `handler` as the 'message' event listener.
 * @NOTE Invokes the `connect()` middleware automatically.
 */
export function listen<
	C extends Context = Context,
	P extends Params = Params,
>(handler: SocketHandler<C, P>): (
	request: Request,
	context: Omit<C, 'params'> & {
		params: OmitIndex<P>;
	}
) => Response;
