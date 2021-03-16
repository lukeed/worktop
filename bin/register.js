const { transform } = require('./esbuild');

const loadJS = require.extensions['.js'];

require.extensions['.ts'] = function (Module, filename) {
	const pitch = Module._compile.bind(Module);

	Module._compile = source => {
		const { code, warnings } = transform(source, {
			banner: 'globalThis.caches = { default: {} };',
			sourcefile: filename,
			loader: 'ts',
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
