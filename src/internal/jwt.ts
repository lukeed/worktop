import * as wc from 'worktop/crypto';
import * as utils from 'worktop/utils';
import * as Base64 from 'worktop/base64';

import type { Factory, JWT, Options } from 'worktop/jwt';

// type: externals
export const INVALID = /*#__PURE__*/ new Error('Invalid token');
export const EXPIRED = /*#__PURE__*/ new Error('Expired token');

// type: helper
export function encode(input: object) {
	return Base64.base64url(JSON.stringify(input));
}

// type: helper
export function toASCII(buff: ArrayBuffer): string {
	return Base64.base64url(
		// @ts-ignore (native) ArrayLike<number[]> vs number[]
		String.fromCharCode.apply(null, new Uint8Array(buff))
	);
}

// type: external
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

// type: template
export function HMAC<P,H>(
	alg: 'HS256' | 'HS384' | 'HS512',
	digest: 'SHA-256' | 'SHA-384' | 'SHA-512',
	options: Options.HMAC<H>
): Factory<P,H> {
	let $: Factory<P,H>, {
		typ, kid, header={},
		key, expires, ...rest
	} = options;

	(header as JWT.Header).alg = alg;
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
			let sign = await wc.HMAC(digest, key, out);
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

// type: template
export function RSA<P,H>(
	alg: 'RS256' | 'RS384' | 'RS512',
	digest: 'SHA-256' | 'SHA-384' | 'SHA-512',
	options: Options.RSA<H>
): Factory<P,H> {
	let {
		typ, kid, header={},
		privkey, pubkey,
		expires, ...rest
	} = options;

	(header as JWT.Header).alg = alg;
	(header as JWT.Header).typ = typ || 'JWT';
	if (kid != null) (header as JWT.Header).kid = kid;

	let HEADER = encode(header);

	return {
		async sign(payload) {
			let pp: JWT.Payload = { ...rest, ...payload };
			pp.iat = pp.iat || Date.now() / 1e3 | 0;

			if (pp.exp == null && expires != null) {
				pp.exp = pp.iat + expires;
			}

			let out = HEADER + '.' + encode(pp);

			let key = await crypto.subtle.importKey(
				'pkcs8', utils.viaPEM(privkey),
				{ name: 'RSASSA-PKCS1-v1_5', hash: digest },
				false, ['sign']
			);

			let sign = await wc.sign('RSASSA-PKCS1-v1_5', key, out);
			return out + '.' + toASCII(sign);
		},
		async verify(input) {
			let bits = decode(input);
			let [hh, pp, ss] = input.split('.');
			if (hh !== HEADER) throw INVALID;

			let data = bits.payload as JWT.Payload<P>;
			if (data.exp != null && data.exp < Date.now() / 1e3) {
				throw EXPIRED;
			}

			ss = Base64.decode(ss);
			let load = hh + '.' + pp;

			// TODO: Buffer.encode
			let i=0, len=ss.length;
			let sign = new Uint8Array(len);

			for (; i < len; i++) {
				sign[i] = ss.charCodeAt(i);
			}

			let key = await crypto.subtle.importKey(
				'spki', utils.viaPEM(pubkey),
				{ name: 'RSASSA-PKCS1-v1_5', hash: digest },
				false, ['verify']
			);

			let bool = await wc.verify('RSASSA-PKCS1-v1_5', key, load, sign);
			if (bool) return data;
			throw INVALID;
		}
	};
}
