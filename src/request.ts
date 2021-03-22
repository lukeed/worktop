import { body } from './internal/request';
import type { ServerRequest as SR } from 'worktop/request';

/**
 * @TODO Cast `query` as object again?
 */
export function ServerRequest(this: SR, event: FetchEvent): SR {
	const { request, waitUntil } = event;
	const url = new URL(request.url);
	const $ = this;

	$.url = request.url;
	$.method = request.method;
	$.headers = request.headers;
	$.extend = waitUntil;
	$.cf = request.cf;
	$.params = {};

	$.path = url.pathname;
	$.hostname = url.hostname;
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
