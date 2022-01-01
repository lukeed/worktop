import type { Context, Params } from 'worktop';
import type { Dict, Strict, Promisable } from 'worktop/utils';

export type State = Dict<any>;

export interface Socket<S extends State = State> {
	send: WebSocket['send'];
	close: WebSocket['close'];
	state: S; // todo: not happy w/ name
	event:
		| { type: 'open' } & Event
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
 * Establish a Websocket connection.
 * Attach the `handler` as the 'message' event listener.
 * @NOTE Invokes the `ws.connect` middleware automatically.
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
