/// <reference lib="webworker" />

import type { Bindings, CronEvent } from 'worktop';

export type ModuleContext = Pick<FetchEvent, 'waitUntil'>;
export type FetchContext = ModuleContext & Pick<FetchEvent, 'passThroughOnException'>;

type OmitIndex<T> = {
	[K in keyof T as {} extends Record<K, 1> ? never : K]: T[K];
};

export type FetchHandler<B extends Bindings = Bindings> = (request: Request, env: OmitIndex<B>, ctx: FetchContext) => Promise<Response> | Response;
export type CronHandler<B extends Bindings = Bindings> = (event: Omit<CronEvent, 'waitUntil'>, env: OmitIndex<B>, ctx: ModuleContext) => Promise<void> | void;

export interface ModuleWorker<B extends Bindings = Bindings> {
	fetch?: FetchHandler<B>;
	scheduled?: CronHandler<B>;
}
