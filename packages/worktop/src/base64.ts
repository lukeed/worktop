export const encode = /*#__PURE__*/ btoa;
export const decode = /*#__PURE__*/ atob;

// @see https://tools.ietf.org/html/rfc4648
// @see https://en.wikipedia.org/wiki/Base64#URL_applications
export function base64url(value: string): string {
	return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}
