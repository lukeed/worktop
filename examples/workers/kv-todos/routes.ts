import { send } from 'worktop/response';
import * as utils from 'worktop/utils';
import * as Model from './model';

import type { Todo } from './model';
import type { Handler } from 'worktop';

/**
 * GET /users/:username/todos
 */
export const list: Handler = async function (req, context) {
	// Read `?limit=` and/or `?page=` values
	const query = Object.fromEntries(context.url.searchParams);
	const limit = Math.min(+query.limit || 50, 50);
	const page = Math.min(+query.page || 1, 1);

	const { username } = context.params;
	const data = await Model.list(context.bindings.TODOS, username, { limit, page });
	return send(200, { data }, { 'cache-control': 'private,max-age=30' });
}

/**
 * POST /users/:username/todos
 */
export const create: Handler = async function (req, context) {
	const { username } = context.params;

	// Grab input values;
	// NOTE: assumes JSON or FormData
	const input = await utils.body<Todo>(req);
	const title = input && (input.title || '').trim();
	if (!input || !title) return send(422, { title: 'required' });

	const result = await Model.insert(context.bindings.TODOS, username, { ...input, title });

	if (result) return send(201, result);
	return send(500, 'Error creating item');
}

/**
 * GET /users/:username/todos/:uid
 */
export const show: Handler = async function (req, context) {
	const { username, uid } = context.params;
	const item = await Model.find(context.bindings.TODOS, username, uid);

	if (item) return send(200, item);
	else return send(404, 'Missing item');
}

/**
 * PUT /users/:username/todos/:uid
 */
export const update: Handler = async function (req, context) {
	const { username } = context.params;

	// Grab input values;
	// NOTE: assumes JSON or FormData
	const input = await utils.body<Todo>(req);
	const title = input && (input.title || '').trim();
	if (!input || !title) return send(422, { title: 'required' });

	const result = await Model.update(context.bindings.TODOS, username, input);

	if (result) return send(201, result);
	return send(500, 'Error updating item');
}

/**
 * DELETE /users/:username/todos/:uid
 */
export const destroy: Handler = async function (req, context) {
	const { username, uid } = context.params;
	const isDone = await Model.destroy(context.bindings.TODOS, username, uid);

	if (isDone) return send(204);
	else return send(500, 'Error removing item');
}
