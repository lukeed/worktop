import { body } from './internal/request';
import type { ServerRequest as SR, Method } from 'worktop/request';

export function ServerRequest(this: SR, event: FetchEvent): SR {
	const $ = this;
	const { request } = event;
	const url = new URL(request.url);

	$.url = request.url;
	$.method = request.method as Method;
	$.headers = request.headers;
	$.extend = event.waitUntil.bind(event);
	$.cf = request.cf;
	$.params = {};

	$.path = url.pathname;
	$.hostname = url.hostname;
	$.origin = url.origin;
	$.query = url.searchParams;
	$.search = url.search;

	// @ts-ignore - expects all properties upfront
	$.body = body.bind(0, request, $.headers.get('content-type'));
	$.body.blob=request.blob.bind(request); $.body.text=request.text.bind(request);
	$.body.arrayBuffer = request.arrayBuffer.bind(request);
	$.body.formData = request.formData.bind(request);
	$.body.json = request.json.bind(request);

	return $;
}
