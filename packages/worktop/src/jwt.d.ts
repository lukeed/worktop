import type { Dict, Strict } from 'worktop/utils';

export declare namespace JWT {
	// Custom token claims
	export type Claims = Dict<unknown>;

	export type Header<C = Claims> = {
		/** algorithm */
		alg?: string;
		/** type */
		typ?: string;
		/** key id */
		kid?: string;
		// others?
	} & Strict<C>;

	export type Payload<C = Claims> = {
		/** issuer */
		iss?: string;
		/** subject */
		sub?: string;
		/** audience */
		aud?: string;
		/** jwt ID */
		jti?: string;
		/** not before */
		nbf?: number;
		/** expires */
		exp?: number;
		/** issued at */
		iat?: number;
	} & Strict<C>;
}

export interface Factory<P=JWT.Claims, H=JWT.Claims> {
	sign(payload: JWT.Payload<P>): Promise<string>;
	verify(input: string): Promise<JWT.Payload<P>>;
}

export namespace Options {
	type Common<H=JWT.Claims> = JWT.Payload & Omit<JWT.Header, 'alg'> & {
		/** custom header claims, if any */
		header?: H;
		/** token lifetime, in seconds */
		expires?: number; // TODO: ttl?
	};

	export type HMAC<H=JWT.Claims> = Common<H> & {
		key: string;
	};

	export type RSA<H=JWT.Claims> = Common<H> & {
		privkey: string;
		pubkey: string;
	};

	export type ECDSA<H=JWT.Claims> = Common<H> & {
		privkey: string;
		pubkey: string;
	};
}

export function decode<P=JWT.Claims, H=JWT.Claims>(input: string): {
	header: JWT.Header<H>;
	payload: JWT.Payload<P>;
	signature: string;
};

// HMAC + SHA-256|384|512
export function HS256<P=JWT.Claims, H=JWT.Claims>(options: Options.HMAC<H>): Factory<P,H>;
export function HS384<P=JWT.Claims, H=JWT.Claims>(options: Options.HMAC<H>): Factory<P,H>;
export function HS512<P=JWT.Claims, H=JWT.Claims>(options: Options.HMAC<H>): Factory<P,H>;

// RSASSA-PKCS1-v1_5 + SHA-256|384|512
export function RS256<P=JWT.Claims, H=JWT.Claims>(options: Options.RSA<H>): Factory<P,H>;
export function RS384<P=JWT.Claims, H=JWT.Claims>(options: Options.RSA<H>): Factory<P,H>;
export function RS512<P=JWT.Claims, H=JWT.Claims>(options: Options.RSA<H>): Factory<P,H>;

// // RSASSA-PSS + SHA-256|384|512
// export function PS256<P=JWT.Claims, H=JWT.Claims>(options: any): Factory<P,H>;
// export function PS384<P=JWT.Claims, H=JWT.Claims>(options: any): Factory<P,H>;
// export function PS512<P=JWT.Claims, H=JWT.Claims>(options: any): Factory<P,H>;

// ECDSA + P-256|384|512 curve
export function ES256<P=JWT.Claims, H=JWT.Claims>(options: Options.ECDSA<H>): Factory<P,H>;
export function ES384<P=JWT.Claims, H=JWT.Claims>(options: Options.ECDSA<H>): Factory<P,H>;
export function ES512<P=JWT.Claims, H=JWT.Claims>(options: Options.ECDSA<H>): Factory<P,H>;
