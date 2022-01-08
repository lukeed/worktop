import * as Cache from 'worktop/cache';

const CFW_CACHE = /*#__PURE__*/ caches.default;

export const save = /*#__PURE__*/ Cache.save.bind(0, CFW_CACHE);
export const lookup = /*#__PURE__*/ Cache.lookup.bind(0, CFW_CACHE);
export const sync = /*#__PURE__*/ Cache.sync.bind(0, CFW_CACHE);

export { isCacheable } from 'worktop/cache';
