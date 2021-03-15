/// <reference lib="webworker" />

export const Cache: Cache;
export function save(event: FetchEvent, res: Response, request?: Request | string): Response;
export function lookup(event: FetchEvent, request?: Request | string): Promise<Response | void>;
export function isCacheable(res: Response): boolean;
