import * as wc from 'worktop/crypto';
import * as utils from 'worktop/utils';
import * as Base64 from 'worktop/base64';

import type { Factory, JWT, Options } from 'worktop/jwt';
import type { Algorithms } from 'worktop/crypto';

type SIZE = '256' | '384' | '512';

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

export function toContent(hh: string, pp: JWT.Payload, expires?: number): string {
	pp.iat = pp.iat || Date.now() / 1e3 | 0;
	if (pp.exp == null && expires != null) {
		pp.exp = pp.iat + expires;
	}
	return hh + '.' + encode(pp);
}

// type: template
export function HMAC<P,H>(bits: SIZE, options: Options.HMAC<H>): Factory<P,H> {
	let $: Factory<P,H>, {
		typ, kid, header={},
		key, expires, ...rest
	} = options;

	(header as JWT.Header).alg = 'HS' + bits;
	(header as JWT.Header).typ = typ || 'JWT';
	if (kid != null) (header as JWT.Header).kid = kid;

	let HEADER = encode(header);

	return $ = {
		async sign(payload) {
			let out = toContent(HEADER, { ...rest, ...payload }, expires);
			let sign = await wc.HMAC(`SHA-${bits}`, key, out);
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
export function RSA<P,H>(bits: SIZE, options: Options.RSA<H>): Factory<P,H> {
	let {
		typ, kid, header={},
		privkey, pubkey,
		expires, ...rest
	} = options;

	(header as JWT.Header).alg = 'RS' + bits;
	(header as JWT.Header).typ = typ || 'JWT';
	if (kid != null) (header as JWT.Header).kid = kid;

	let HEADER = encode(header);
	let hasher: Algorithms.Signing = 'RSASSA-PKCS1-v1_5';
	let keyer: RsaHashedImportParams = {
		name: 'RSASSA-PKCS1-v1_5',
		hash: `SHA-${bits}`
	};

	return {
		async sign(payload) {
			let key = await crypto.subtle.importKey(
				'pkcs8', utils.viaPEM(privkey),
				keyer, false, ['sign']
			);

			let out = toContent(HEADER, { ...rest, ...payload }, expires);
			let sign = await wc.sign(hasher, key, out);
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
				keyer, false, ['verify']
			);

			let bool = await wc.verify(hasher, key, load, sign);
			if (bool) return data;
			throw INVALID;
		}
	};
}

// type: template
export function ECDSA<P,H>(bits: SIZE, options: Options.ECDSA<H>): Factory<P,H> {
	let {
		typ, kid, header={},
		privkey, pubkey,
		expires, ...rest
	} = options;

	(header as JWT.Header).alg = 'ES' + bits;
	(header as JWT.Header).typ = typ || 'JWT';
	if (kid != null) (header as JWT.Header).kid = kid;

	let HEADER = encode(header);

	let keyer: EcKeyImportParams = {
		name: 'ECDSA',
		namedCurve: `P-${bits}`,
	};

	let hasher: Algorithms.Signing = {
		name: 'ECDSA',
		hash: `SHA-${bits}`,
	};

	return {
		async sign(payload) {
			let key = await crypto.subtle.importKey(
				'pkcs8', utils.viaPEM(privkey),
				keyer, false, ['sign']
			);

			let out = toContent(HEADER, { ...rest, ...payload }, expires);
			let sign = await wc.sign(hasher, key, out);
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
				keyer, false, ['verify']
			);

			let bool = await wc.verify(hasher, key, load, sign);
			if (bool) return data;
			throw INVALID;
		}
	};
}
