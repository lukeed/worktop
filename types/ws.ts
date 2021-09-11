import * as ws from 'worktop/ws';
import { compose } from 'worktop';

import type { Router } from 'worktop';
import type { WebSocket } from 'worktop/ws';
import type { Params, ServerRequest } from 'worktop/request';

declare const API: Router;

/**
 * HANDLER
 */

const onEvent1: ws.SocketHandler = async function (req, socket) {
	assert<ws.Socket>(socket);
	assert<ServerRequest<Params>>(req);
	assert<ServerRequest>(req);

	let { context, event } = socket;
	assert<Event>(event);
	assert<ws.Context>(context);
	assert<'open'|'close'|'message'|'error'>(event.type);

	if (event.type === 'message') {
		assert<string>(event.data);
	} else {
		// @ts-expect-error
		event.data;
	}
}

type CustomParams = { game?: string };
type CustomContext = { score?: number };
const onEvent2: ws.SocketHandler<CustomParams, CustomContext> = function (req, socket) {
	let { event, context } = socket;

	if (event.type !== 'message') {
		return;
	}

	let { game } = req.params;
	let data = JSON.parse(event.data);
	context.score = context.score || 0;

	switch (data.type) {
		case '+1':
		case 'incr': {
			return socket.send(`${game} score: ${++context.score}`);
		}
		case '-1':
		case 'decr': {
			return socket.send(`${game} score: ${--context.score}`);
		}
	}
}

/**
 * ROUTER
 */

API.add('GET', '/score/:game', ws.listen(onEvent2));
API.add('GET', /^[/]foobar[/]/, compose(
	(req, res) => {},
	ws.listen(onEvent1)
));

/**
 * EVENTS
 */

declare let websocket1: WebSocket;
declare let listener1: EventListener;

// @ts-expect-error - "open" not allowed
websocket1.addEventListener('open', listener1);
websocket1.addEventListener('close', listener1);
websocket1.addEventListener('error', listener1);
websocket1.addEventListener('message', evt => {
	assert<MessageEvent>(evt);
	assert<string>(evt.data);
});
