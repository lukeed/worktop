import * as Base64 from 'worktop/base64';
import * as crypto from 'worktop/crypto';

import type { Factory, JWT, Options } from 'worktop/jwt';

export const INVALID = /*#__PURE__*/ new Error('Invalid token');
export const EXPIRED = /*#__PURE__*/ new Error('Expired token');

function encode(input: object) {
	return Base64.base64url(JSON.stringify(input));
}

function toASCII(buff: ArrayBuffer): string {
	return Base64.base64url(
		// @ts-ignore (native) ArrayLike<number[]> vs number[]
		String.fromCharCode.apply(null, new Uint8Array(buff))
	);
}

export function decode(input: string) {
	let segs = input.split('.');
	if (segs.length !== 3) throw INVALID;

	try {
		let payload = Base64.decode(segs[1]);
		var hh = JSON.parse(Base64.decode(segs[0]));
		var pp = hh.typ === 'JWT' ? JSON.parse(payload) : payload;
	} catch (e) {
		throw INVALID;
	}

	return {
		header: hh,
		payload: pp,
		signature: segs[2]
	};
}

//
export function HS256<P,H>(options: Options.HMAC<H>): Factory<P,H> {
	let $: Factory<P,H>, {
		typ, kid, header={},
		key, expires, ...rest
	} = options;

	(header as JWT.Header).alg = 'HS256';
	(header as JWT.Header).typ = typ || 'JWT';
	if (kid != null) (header as JWT.Header).kid = kid;

	let HEADER = encode(header);

	return $ = {
		async sign(payload) {
			let pp: JWT.Payload = { ...rest, ...payload };
			pp.iat = pp.iat || Date.now() / 1e3 | 0;

			if (pp.exp == null && expires != null) {
				pp.exp = pp.iat + expires;
			}

			let out = HEADER + '.' + encode(pp);
			let sign = await crypto.HMAC('SHA-256', key, out);
			return out + '.' + toASCII(sign);
		},
		async verify(input) {
			let bits = decode(input);
			if (encode(bits.header) !== HEADER) throw INVALID;

			let data = bits.payload as JWT.Payload<P>;
			if (data.exp != null && data.exp < Date.now() / 1e3) {
				throw EXPIRED;
			}

			let check = await $.sign(data);
			if (check !== input) throw INVALID;

			return data;
		}
	};
}
