import * as jwt from 'worktop/jwt';

interface Payload {
	foo: number;
}

/**
 * DECODE
 */

// @ts-expect-error
jwt.decode(123);

// @ts-expect-error
jwt.decode({ foo: 123 });

let token = jwt.decode('token');
assert<jwt.JWT.Header>(token.header);
assert<jwt.JWT.Payload>(token.payload);
assert<string>(token.signature);

/**
 * HS256
 */

const HS256 = jwt.HS256<Payload>({
	key: 'secret',
	expires: 3600, // eg, 1 hr
	// iss: '...',
	// aud: '...',
	// nonce: '...',
});

assert<jwt.Factory<Payload>>(HS256);

// @ts-expect-error
HS256.sign(123);

// @ts-expect-error
HS256.sign({ bar: 'asd' });

assert<Promise<string>>(
	HS256.sign({ foo: 123 })
);

assert<string>(
	await HS256.sign({ foo: 123 })
);

// @ts-expect-error
await HS256.verify(123);

// @ts-expect-error
await HS256.verify({ foo: 123 });

assert<unknown>(
	await HS256.verify('token')
);
