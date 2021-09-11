import * as Cache from 'worktop/cache';

declare const event: FetchEvent;

// @ts-expect-error
Cache.save(event, 123);
// @ts-expect-error
Cache.save(123, event);
// @ts-expect-error
Cache.save(123);

assert<Response>(
	Cache.save(event, new Response)
);

assert<Response>(
	Cache.save(event, new Response, '/custom')
);

assert<Response>(
	Cache.save(event, new Response, new Request('/custom'))
);

// @ts-expect-error
Cache.lookup(event, new Response);

Cache.lookup(event, '/custom');
Cache.lookup(event, new Request('/custom'));
