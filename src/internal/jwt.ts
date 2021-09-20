import * as wc from 'worktop/crypto';
import * as utils from 'worktop/utils';
import * as Base64 from 'worktop/base64';
import * as buff from 'worktop/buffer';

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
export function toASCII(input: ArrayBuffer): string {
	return Base64.base64url(buff.toBinary(input));
}

// type: external
export function decode<P,H>(input: string): {
	header: JWT.Header<H>;
	payload: JWT.Payload<P>;
	signature: string;
} {
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

// type: internal
export function toContent(hh: string, pp: JWT.Payload, expires?: number): string {
	pp.iat = pp.iat || Date.now() / 1e3 | 0;
	if (pp.exp == null && expires != null) {
		pp.exp = pp.iat + expires;
	}
	return hh + '.' + encode(pp);
}

// type: internal
export function validate<P,H>(hh: string, input: string) {
	let parts = decode<P,H>(input);
	let pp = parts.payload;

	if (!input.startsWith(hh + '.')) throw INVALID;
	if (pp.exp != null && pp.exp < Date.now() / 1e3) throw EXPIRED;

	return parts;
}

export function prepare<H>(
	type: 'HS' | 'RS' | 'ES', bits: SIZE,
	options: Omit<Options.Common<H>, 'expires'>
): {
	header: string,
	config: JWT.Payload
} {
	let { kid, typ, header:claims, ...config } = options;

	let hh: JWT.Header = {
		...claims,
		alg: type+bits,
		typ: typ || 'JWT',
	};
	if (kid != null) hh.kid = kid;

	let header = encode(hh);
	return { header, config };
}

// type: template
export function HMAC<P,H>(bits: SIZE, options: Options.HMAC<H>): Factory<P,H> {
	let $: Factory<P,H>, { key, expires, ...rest } = options;
	let { header, config } = prepare<H>('HS', bits, rest);

	return $ = {
		async sign(payload) {
			let out = toContent(header, { ...config, ...payload }, expires);
			let sign = await wc.HMAC(`SHA-${bits}`, key, out);
			return out + '.' + toASCII(sign);
		},
		async verify(input) {
			let parts = validate<P,H>(header, input);
			let check = await $.sign(parts.payload);
			if (check !== input) throw INVALID;
			return parts.payload;
		}
	};
}

// type: template
export function RSA<P,H>(bits: SIZE, options: Options.RSA<H>): Factory<P,H> {
	let { privkey, pubkey, expires, ...rest } = options;
	let { header, config } = prepare<H>('RS', bits, rest);

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

			let out = toContent(header, { ...config, ...payload }, expires);
			let sign = await wc.sign(hasher, key, out);
			return out + '.' + toASCII(sign);
		},
		async verify(input) {
			let [hh, pp, ss] = input.split('.');
			let parts = validate<P,H>(header, input);

			let load = hh + '.' + pp;
			let sign = buff.asBinary(
				Base64.decode(ss)
			);

			let key = await crypto.subtle.importKey(
				'spki', utils.viaPEM(pubkey),
				keyer, false, ['verify']
			);

			let bool = await wc.verify(hasher, key, load, sign);
			if (bool) return parts.payload;
			throw INVALID;
		}
	};
}

// type: template
export function ECDSA<P,H>(bits: SIZE, options: Options.ECDSA<H>): Factory<P,H> {
	let { privkey, pubkey, expires, ...rest } = options;
	let { header, config } = prepare<H>('ES', bits, rest);

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

			let out = toContent(header, { ...config, ...payload }, expires);
			let sign = await wc.sign(hasher, key, out);
			return out + '.' + toASCII(sign);
		},
		async verify(input) {
			let [hh, pp, ss] = input.split('.');
			let parts = validate<P,H>(header, input);

			let load = hh + '.' + pp;
			let sign = buff.asBinary(
				Base64.decode(ss)
			);

			let key = await crypto.subtle.importKey(
				'spki', utils.viaPEM(pubkey),
				keyer, false, ['verify']
			);

			let bool = await wc.verify(hasher, key, load, sign);
			if (bool) return parts.payload;
			throw INVALID;
		}
	};
}
