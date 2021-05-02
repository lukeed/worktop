import * as Model from './model';

import type { Todo } from './model';
import type { Handler } from 'worktop';

/**
 * GET /users/:username/todos
 */
export const list: Handler = async function (req, res) {
	// Read `?limit=` and/or `?page=` values
	const query = Object.fromEntries(req.query);
	const limit = Math.min(+query.limit || 50, 50);
	const page = Math.min(+query.page || 1, 1);

	const { username } = req.params;
	const data = await Model.list(username, { limit, page });
	res.send(200, { data }, { 'cache-control': 'private,max-age=30' });
}

/**
 * POST /users/:username/todos
 */
export const create: Handler = async function (req, res) {
	const { username } = req.params;

	// Grab input values;
	// NOTE: assumes JSON or FormData
	const input = await req.body<Todo>();
	const title = input && (input.title || '').trim();
	if (!input || !title) return res.send(422, { title: 'required' });

	const result = await Model.insert(username, { ...input, title });

	if (result) res.send(201, result);
	else res.send(500, 'Error creating item');
}

/**
 * GET /users/:username/todos/:uid
 */
export const show: Handler = async function (req, res) {
	const { username, uid } = req.params;
	const item = await Model.find(username, uid);

	if (item) res.send(200, item);
	else res.send(404, 'Missing item');
}

/**
 * PUT /users/:username/todos/:uid
 */
export const update: Handler = async function (req, res) {
	const { username } = req.params;

	// Grab input values;
	// NOTE: assumes JSON or FormData
	const input = await req.body<Todo>();
	const title = input && (input.title || '').trim();
	if (!input || !title) return res.send(422, { title: 'required' });

	const result = await Model.update(username, input);

	if (result) res.send(201, result);
	else res.send(500, 'Error updating item');
}

/**
 * DELETE /users/:username/todos/:uid
 */
export const destroy: Handler = async function (req, res) {
	const { username, uid } = req.params;
	const isDone = await Model.destroy(username, uid);

	if (isDone) res.send(204);
	else res.send(500, 'Error removing item');
}
