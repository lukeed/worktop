import { STATUS_CODES } from 'worktop/response';
import { byteLength } from 'worktop/utils';

export function abort(code: number): Response {
	let message = STATUS_CODES[code];
	return new Response(message, {
		status: code,
		statusText: message,
		headers: {
			'Connection': 'close',
			'Content-Type': 'text/plain',
			'Content-Length': '' + byteLength(message)
		}
	});
}
