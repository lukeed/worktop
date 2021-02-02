// worktop/cache
export const Cache: Cache;
export function isCachable(res: Response): boolean;
export function toCache(event: FetchEvent, res: Response): Response;
