import { Router } from 'worktop';
import * as sworker from 'worktop/sw';
import * as ws from 'worktop/ws';

const API = new Router;

function reply(socket: ws.Socket, type: string, data: number|string) {
	let message = JSON.stringify({ type, data });
	socket.send(message);
}

API.add('GET', '/counter/:name', ws.listen(function (req, context, socket) {
	let { name } = context.params;
	let { event, state } = socket;

	// ignore non-'message' events
	if (event.type !== 'message') return;

	// initialize context on start
	state.count = state.count || 0;

	// parse & react to incoming message data
	let { type, value=1 } = JSON.parse(event.data);

	if (type === 'ping') {
		return reply(socket, 'pong', Date.now());
	}

	if (type === 'incr') {
		state.count += value;
		return reply(socket, name, state.count);
	}

	if (type === 'decr') {
		state.count -= value;
		return reply(socket, name, state.count);
	}

	if (type === 'exit') {
		reply(socket, 'exit', 'goodbye');
		return socket.close();
	}
}));

/**
 * send HTML page
 */
API.add('GET', '/', (req, context) => {
	return new Response(`
		<html lang="en">
			<head>
				<meta charset="utf-8"/>
				<title>worktop/ws · demo</title>
				<style>
					* {
						margin: 0;
						padding: 0;
					}
					body {
						display: flex;
						align-items: center;
						justify-content: center;
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
						flex-direction: column;
					}
					form {
						width: 100%;
						max-width: 600px;
						margin: 0 auto 2rem;
						border-bottom: 2px dashed;
						padding: 2rem;
						display: grid;
						grid-template-columns: 2fr 1fr 1fr 1fr;
						grid-column-gap: 1rem;
					}
					form > span {
						display: block;
					}
					pre {
						width: 100%;
						height: 400px;
						max-width: 600px;
						overflow-y: scroll;
						font-size: 1.2rem;
					}
					code, output, label, input {
						display: block;
					}
					label {
						width: 100%;
						font-weight: bold;
					}
					output {
						font-weight: normal;
						font-family: monospace;
						font-size: 1.2rem;
					}
				</style>
			</head>
			<body>
				<form>
					<span>
						<label for="amount">
							Amount <input id="amount" type="number" value="1">
						</label>
						<button id="decr" type="button">Decrement</button>
						<button id="incr" type="button">Increment</button>
					</span>

					<label>
						VALUE: <output id="value">0</output>
					</label>

					<label>
						PING: <output id="ping"></output>
					</label>

					<button id="exit" type="button">STOP</button>
				</form>

				<pre id="logs"></pre>

				<script>
					var $ = document.querySelector.bind(document);
					var url = new URL('/counter/GUEST', location.href);

					var logs = $('#logs');
					var value = $('#value');
					var amount = $('#amount');
					var ping = $('#ping');

					function log(type, text='') {
						var item = document.createElement('code');
						item.innerText = '[' + type + '] ' + text;
						logs.appendChild(item);
					}

					function send(type, root={}) {
						ws.send(JSON.stringify({ ...root, type }));
					}

					url.protocol = 'wss:';
					var timer, ws = new WebSocket(url.href);

					ws.onopen = function () {
						log('open');
						// ping immediately
						send('ping');
						// send a "ping" message every 5s
						timer = setInterval(() => send('ping'), 5e3);
					}

					/** @param {MessageEvent} evt */
					ws.onmessage = function (evt) {
						log('message', evt.data);
						let { type, data } = JSON.parse(evt.data);

						switch (type) {
							case 'pong': {
								ping.innerText = Math.abs(Date.now() - data) + 'ms';
								break;
							}
							case 'exit': {
								ws.close();
								break;
							}
							default: {
								// will be "GUEST" because of pathname
								value.value = data;
							}
						}
					}

					ws.onerror = ws.onclose = function (evt) {
						log(evt.type, evt.reason || evt.message || '');
						timer = clearInterval(timer);
					}

					// click listeners
					$('#decr').onclick = function (evt) {
						send('decr', { value: +amount.value });
					}

					$('#incr').onclick = function (evt) {
						send('incr', { value: +amount.value });
					}

					$('#exit').onclick = function (evt) {
						send('exit');
					}
				</script>
			</body>
		</html>
	`, {
		status: 200,
		headers: {
			'Content-Type': 'text/html'
		}
	});
});

// Format: Service Worker
// Wraps w/ addEventListener('fetch', ...)
sworker.start(API.run);
