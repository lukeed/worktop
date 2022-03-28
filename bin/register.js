// @ts-ignore - definitions
require('fetchy/polyfill');

// @ts-ignore - worktop/cfw.cache
globalThis.caches = { default: {} };

// @ts-ignore - worktop/utils, worktop/crypto
globalThis.crypto = require('crypto').webcrypto;

// worktop/base64
globalThis.btoa = (x) => Buffer.from(x, 'binary').toString('base64');
globalThis.atob = (x) => Buffer.from(x, 'base64').toString('binary');
