/// <reference lib="webworker" />

import type { Bindings, CronEvent, ModuleContext } from 'worktop';
import type { Promisable, OmitIndex } from 'worktop/utils';
import type { ResponseHandler } from 'worktop/sw';

export type FetchHandler<B extends Bindings = Bindings> = (
	request: Request,
	bindings: OmitIndex<B>,
	context: Required<ModuleContext>
) => Promisable<Response>;

export type CronHandler<B extends Bindings = Bindings> = (
	event: Omit<CronEvent, 'waitUntil'>,
	bindings: OmitIndex<B>,
	context: Pick<ModuleContext, 'waitUntil'>
) => Promisable<void>;

export interface ModuleWorker<B extends Bindings = Bindings> {
	fetch?: FetchHandler<B>;
	scheduled?: CronHandler<B>;
}

/**
 * Tiny helper for easy TypeScript definition inferences
 */
export function define<B extends Bindings = Bindings>(worker: ModuleWorker<B>): ModuleWorker<B>;

/**
 * Quickly "convert" a ServiceWorker `ResponseHandler` into a `ModuleWorker` definition.
 */
export function listen<B extends Bindings = Bindings>(handler: ResponseHandler): ModuleWorker<B>;
