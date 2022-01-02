import { HS256 } from 'worktop/jwt';
import * as CORS from 'worktop/cors';
import { Router, compose } from 'worktop';
import { reply } from 'worktop/response';
import * as utils from 'worktop/utils';
import { start } from 'worktop/sw';

import type { Context } from 'worktop';
import type { ULID } from 'worktop/utils';

interface Custom extends Context {
	timestamp: number;
}

interface Account {
	uid: ULID;
	name: string;
	email: string;
	// ...
}

type TokenPayload = Pick<Account, 'uid' | 'email'>;

// Create new Router
const API = new Router<Custom>();

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
	return reply(200, 'OK');
});

API.add('GET', '/accounts/:uid', async (req, context) => {
	try {
		let res = await fetch(`https://example.com/users/${context.params.uid}`)
		if (!res.ok) return reply(404, 'Unknown account identifier');
		let item = await res.json() as Account;

		return reply(200, item, {
			'Cache-Control': 'public,max-age=900'
		});
	} catch (err) {
		return reply(500, 'Error retrieving account');
	}
});

API.add('POST', '/accounts', async (req, context) => {
	try {
		var input = await utils.body<Account>(req);
		if (input == null) return reply(400, 'Missing request body');
	} catch (err) {
		return reply(500, 'Error parsing request');
	}

	try {
		var values: Account = {
			uid: utils.ulid(),
			name: input.name || '',
			email: input.email || '',
		};

		var Location = `https://${context.url.hostname}/accounts/${values.uid}`;
		var Resource = `https://example.com/users/${values.uid}`;

		let res = await fetch(Resource, {
			method: 'PUT',
			body: JSON.stringify(values),
			headers: {
				'Content-Type': 'application/json'
			},
		});

		if (!res.ok) {
			return reply(400, 'Error saving account');
		}
	} catch (err) {
		return reply(500, 'Error creating account');
	}

	try {
		let JWT = HS256<TokenPayload>({
			key: '<YOUR JWT SECRET>',
			iss: context.url.origin,
			expires: 3600 * 3, // 3 hours
		});

		let token = await JWT.sign({
			uid: values.uid,
			email: values.email,
		});

		return reply(201, { token, values }, { Location });
	} catch (err) {
		await fetch(Resource, { method: 'DELETE' });
		return reply(500, 'Error signing token');
	}
});

// Service Worker
start(API.run);
