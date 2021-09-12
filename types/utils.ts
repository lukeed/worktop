import * as utils from 'worktop/utils';
import type { UID, UUID, ULID } from 'worktop/utils';

declare let request: Request;

/**
 * HEX
 */

// @ts-expect-error
HEX.push('hello', 'world');

// @ts-expect-error
HEX[10] = 'cannot do this';

assert<readonly string[]>(utils.HEX);

/**
 * UID
 */

assert<Function>(utils.uid);
assert<string>(utils.uid(24));
assert<Fixed.String<24>>(utils.uid(24));
assert<UID<24>>(utils.uid(24));
assert<string>(utils.uid());
assert<Fixed.String<11>>(utils.uid());
assert<UID<11>>(utils.uid());

// @ts-expect-error
assert<UID<24>>(uid(32));

/**
 * UUID
 */

assert<Function>(utils.uuid);
assert<string>(utils.uuid());
assert<UUID>(utils.uuid());

// @ts-expect-error
assert<Fixed.String<11>>(utils.uuid());
assert<UID<36>>(utils.uuid());

/**
 * ULID
 */

assert<Function>(utils.ulid);
assert<string>(utils.ulid());
assert<ULID>(utils.ulid());

// @ts-expect-error
assert<Fixed.String<11>>(utils.ulid());
assert<UID<26>>(utils.ulid());

/**
 * BYTELENGTH
 */

assert<Function>(utils.byteLength);
assert<number>(utils.byteLength(undefined));
assert<number>(utils.byteLength('hello'));
assert<number>(utils.byteLength(''));
assert<number>(utils.byteLength());

/**
 * RANDOMIZE
 */

assert<Function>(utils.randomize);
assert<Uint8Array>(utils.randomize(11));
// @ts-expect-error
assert<Uint8Array>(utils.randomize());
// @ts-expect-error
assert<Uint32Array>(utils.randomize(1));

/**
 * BODY
 */

assert<unknown>(
	await utils.body(request)
);

assert<ArrayBuffer|void>(
	await utils.body<ArrayBuffer>(request)
);

assert<string|void>(
	await utils.body<string>(request)
);

assert<Item|void>(
	await utils.body<Item>(request)
);
