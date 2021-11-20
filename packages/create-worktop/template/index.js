import { HS256 } from 'worktop/jwt';
import * as CORS from 'worktop/cors';
import * as Cache from 'worktop/cache';
import { Router, compose } from 'worktop';
import { read, write } from 'worktop/kv';
import { send } from 'worktop/response';
import * as utils from 'worktop/utils';

// Create new Router
const API = new Router;

API.prepare = compose(
	// Attach global middleware
	(req, context) => {
		context.timestamp = Date.now();

		context.defer(res => {
			let ms = Date.now() - context.timestamp;
			res.headers.set('x-response-time', ms);
		});
	},

	// Attach global CORS config
	CORS.preflight({
		maxage: 3600 * 6, // 6 hr
		credentials: true,
	})
);

API.add('GET', '/', () => {
	return send(200, 'OK');
});

API.add('GET', '/accounts/:uid', async (req, context) => {
	try {
		let item = await read(context.bindings.ACCOUNT, context.params.uid);
		if (!item) return send(404, 'Unknown account identifier');
		return send(200, item, {
			'Cache-Control': 'public,max-age=900'
		});
	} catch (err) {
		return send(500, 'Error retrieving account');
	}
});

API.add('POST', '/accounts', async (req, context) => {
	try {
		var input = await utils.body(req);
		if (input == null) return send(400, 'Missing request body');
	} catch (err) {
		return send(500, 'Error parsing request');
	}

	try {
		var values = {
			uid: utils.ulid(),
			name: input.name || '',
			email: input.email || '',
		};

		let isOK = await write(context.bindings.ACCOUNT, values.uid, values);
		if (!isOK) return send(400, 'Error saving account');
	} catch (err) {
		return send(500, 'Error creating account');
	}

	try {
		let JWT = HS256({
			key: context.bindings.JWT_KEY,
			iss: context.bindings.JWT_ISS,
			expires: 3600 * 3, // 3 hours
		});

		let token = await JWT.sign({
			uid: values.uid,
			email: values.email,
		});

		return send(201, { token, values });
	} catch (err) {
		await context.bindings.ACCOUNT.delete(values.uid);
		return send(500, 'Error signing token');
	}
});

// Initialize: Module Worker
export default Cache.reply(API.run);
