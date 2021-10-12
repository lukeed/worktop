import { ECDSA, HMAC, RSA } from './internal/jwt';

export { INVALID, EXPIRED } from './internal/jwt';

export { decode } from './internal/jwt';

export const HS256 = /*#__PURE__*/ HMAC.bind(0, '256');
export const HS384 = /*#__PURE__*/ HMAC.bind(0, '384');
export const HS512 = /*#__PURE__*/ HMAC.bind(0, '512');

export const RS256 = /*#__PURE__*/ RSA.bind(0, '256');
export const RS384 = /*#__PURE__*/ RSA.bind(0, '384');
export const RS512 = /*#__PURE__*/ RSA.bind(0, '512');

export const ES256 = /*#__PURE__*/ ECDSA.bind(0, '256');
export const ES384 = /*#__PURE__*/ ECDSA.bind(0, '384');
export const ES512 = /*#__PURE__*/ ECDSA.bind(0, '512');
