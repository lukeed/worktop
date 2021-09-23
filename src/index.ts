import * as swc from '@swc/core';
import type { BundleOptions } from '@swc/core/spack';
import type { Output, Options } from '../';

export async function build(options: Options): Promise<Output> {
	let { output, sourcemap, minify=true } = options;
	let format = options.format === 'cjs' ? 'commonjs' : 'es6';

	let config: swc.Options = {
		minify: minify,
		module: {
			// @ts-ignore
			type: format,
			noInterop: true,
			strictMode: false,
			strict: true,
		},
		sourceMaps: sourcemap ? 'inline' : false,
		jsc: {
			loose: true,
			target: options.target || 'es2021',
			parser: {
				syntax: 'typescript',
				...options.parser,
			}
		}
	};

	// TODO: cwd -> workingDir?
	let opts: BundleOptions = {
		entry: options.input,
		target: options.platform || 'browser',
		externalModules: ([] as string[]).concat(options.external || []),
		mode: 'production',
		options: config,
		module: {
			// ignored
			type: format,
		},
		output: {
			name: 'ignore',
			path: output,
		}
	};

	let result = await swc.bundle(opts).then(r => {
		for (let k in r) return r[k];
	});

	return format !== 'es6'
		? swc.transform(result!.code, config)
		: result!;
}
