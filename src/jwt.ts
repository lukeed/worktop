import { ECDSA, HMAC, RSA } from './internal/jwt';

export { INVALID, EXPIRED } from './internal/jwt';

export { decode } from './internal/jwt';

export const HS256 = /*#__PURE__*/ HMAC.bind(0, 'HS256', 'SHA-256');
export const HS384 = /*#__PURE__*/ HMAC.bind(0, 'HS384', 'SHA-384');
export const HS512 = /*#__PURE__*/ HMAC.bind(0, 'HS512', 'SHA-512');

export const RS256 = /*#__PURE__*/ RSA.bind(0, 'RS256', 'SHA-256');
export const RS384 = /*#__PURE__*/ RSA.bind(0, 'RS384', 'SHA-384');
export const RS512 = /*#__PURE__*/ RSA.bind(0, 'RS512', 'SHA-512');

export const ES256 = /*#__PURE__*/ ECDSA.bind(0, 'ES256', '256');
export const ES384 = /*#__PURE__*/ ECDSA.bind(0, 'ES384', '384');
export const ES512 = /*#__PURE__*/ ECDSA.bind(0, 'ES512', '512');
