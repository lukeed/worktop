import { HMAC } from './internal/jwt';

export { INVALID, EXPIRED } from './internal/jwt';

export { decode } from './internal/jwt';

export const HS256 = /*#__PURE__*/ HMAC.bind(0, 'HS256', 'SHA-256');
export const HS384 = /*#__PURE__*/ HMAC.bind(0, 'HS384', 'SHA-384');
export const HS512 = /*#__PURE__*/ HMAC.bind(0, 'HS512', 'SHA-512');
