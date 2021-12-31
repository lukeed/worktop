import type { WebSocket } from 'worktop/cfw';
import type { Context, Params } from 'worktop';
import type { Dict, Strict, Promisable } from 'worktop/utils';

declare global {
	interface ResponseInit {
		/** @note Cloudflare only */
		webSocket?: WebSocket;
	}
}

export type { WebSocket };
export type State = Dict<any>;

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
		params: Strict<P>;
	}
) => Response;
