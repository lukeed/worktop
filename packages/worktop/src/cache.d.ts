/// <reference lib="webworker" />

import type { Context, Params } from 'worktop';
import type { Strict } from 'worktop/utils';
import type { Module } from 'worktop/cfw';
// TODO: add `EventContext` something

export const Cache: Cache;
export function save(req: Request | string, res: Response, context: Module.Context): Response;
export function lookup(request: Request | string): Promise<Response | void>;
export function isCacheable(res: Response): boolean;

export function sync(): <
	C extends Context = Context,
	P extends Params = Params,
>(
	request: Request,
	context: Omit<C, 'params'> & {
		params: Strict<P & C['params']>;
	}
) => Response | void;
