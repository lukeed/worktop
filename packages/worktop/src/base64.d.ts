/**
 * Create a Base64-encoded ASCII string from a binary string.
 * @NOTE Alias for the `btoa` built-in.
 * @param {string} value
 */
export function encode(value: string): string;

/**
 * Decode a string from a Base64-encoded value.
 * @NOTE Alias for the `atob` built-in.
 * @param {string} value
 */
export function decode(value: string): string;

/**
 * Create a Base64-encoded ASCII string that's safe for use within URL applications.
 * @NOTE This may often be referred to as "base64url" encoding.
 * @see https://en.wikipedia.org/wiki/Base64#URL_applications
 * @param {string} value
 */
export function base64url(value: string): string;
