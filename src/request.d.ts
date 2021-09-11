/// <reference lib="webworker" />



// export declare class ServerRequest<P extends Params = Params> {
// 	constructor(event: FetchEvent);
// 	url: string;
// 	path: string;
// 	method: Method;
// 	origin: string;
// 	hostname: string;
// 	search: string;
// 	query: URLSearchParams;
// 	extend: FetchEvent['waitUntil'];
// 	cf: IncomingCloudflareProperties;
// 	headers: Headers;
// 	params: P;
// 	body: {
// 		<T>(): Promise<T|void>;
// 		json<T=any>(): Promise<T>;
// 		arrayBuffer(): Promise<ArrayBuffer>;
// 		formData(): Promise<FormData>;
// 		text(): Promise<string>;
// 		blob(): Promise<Blob>;
// 	};
// }
