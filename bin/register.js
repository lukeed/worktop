// @ts-check
const { transformSync } = require('esbuild');

const loadJS = require.extensions['.js'];

// @ts-ignore - worktop/utils, worktop/crypto
globalThis.crypto = require('crypto').webcrypto;

// worktop/base64
globalThis.btoa = (x) => Buffer.from(x, 'binary').toString('base64');
globalThis.atob = (x) => Buffer.from(x, 'base64').toString('binary');

require('fetchy/polyfill');

require.extensions['.ts'] = function (Module, filename) {
	const pitch = Module._compile.bind(Module);

	Module._compile = source => {
		const { code, warnings } = transformSync(source, {
			loader: 'ts',
			format: 'cjs',
			target: 'es2019',
			sourcemap: 'inline',
			sourcefile: filename,
			minifyIdentifiers: true,
			minifySyntax: true,
			treeShaking: true,
			charset: 'utf8',
		});

		warnings.forEach(msg => {
			console.warn(`\nesbuild warning in ${filename}:`);
			console.warn(msg.location);
			console.warn(msg.text);
		});

		return pitch(code, filename);
	};

	loadJS(Module, filename);
}
