import * as ws from 'worktop/ws';
import { compose } from 'worktop';

import type { Router, Context } from 'worktop';

declare let API: Router;
declare let websocket: ws.WebSocket;
declare let listener: EventListener;

/**
 * HANDLER
 */

const onEvent1: ws.SocketHandler = async function (req, context, socket) {
	assert<Request>(req);
	assert<Context>(context);
	assert<ws.Socket>(socket);

	let { state, event } = socket;
	assert<Event>(event);
	assert<ws.State>(state);
	assert<'open'|'close'|'message'|'error'>(event.type);

	if (event.type === 'message') {
		assert<string>(event.data);
	} else {
		// @ts-expect-error
		event.data;
	}
}

type CustomParams = { game?: string };
type CustomState = { score?: number };
const onEvent2: ws.SocketHandler<Context, CustomParams, CustomState> = function (req, context, socket) {
	let { event, state } = socket;
	if (event.type !== 'message') return;

	let { game } = context.params;
	assert<string|void>(context.params.game);

	let data = JSON.parse(event.data);
	state.score = state.score || 0;

	switch (data.type) {
		case '+1':
		case 'incr': {
			return socket.send(`${game} score: ${++state.score}`);
		}
		case '-1':
		case 'decr': {
			return socket.send(`${game} score: ${--state.score}`);
		}
	}
}

/**
 * ROUTER
 */

API.add('GET', '/score/:game', ws.listen(onEvent2));
API.add('GET', /^[/]foobar[/]/, compose(
	(req, context) => {},
	ws.listen(onEvent1)
));

/**
 * EVENTS
 */

// @ts-expect-error - "open" not allowed
websocket.addEventListener('open', listener);
websocket.addEventListener('close', listener);
websocket.addEventListener('error', listener);
websocket.addEventListener('message', evt => {
	assert<MessageEvent>(evt);
	assert<string>(evt.data);
});
