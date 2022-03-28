// @ts-ignore - definitions
require('fetchy/polyfill');

// @ts-ignore - worktop/cfw.cache
globalThis.caches = { default: {} };

// @ts-ignore - worktop/utils, worktop/crypto
globalThis.crypto = require('crypto').webcrypto;

// worktop/base64
/** @param {string} x */
globalThis.btoa = (x) => Buffer.from(x, 'binary').toString('base64');
/** @param {string} x */
globalThis.atob = (x) => Buffer.from(x, 'base64').toString('binary');
