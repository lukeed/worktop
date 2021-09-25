// @ts-check
const fs = require('node:fs');
const { build } = require('esbuild');
const { join, dirname } = require('node:path');
const { builtinModules } = require('node:module');
const utils = require('./utils');

const packages = join(__dirname, '../packages');
const overrides = {
	worktop: {
		'router.ts': '.'
	}
};

/** @param {string} message */
function bail(message) {
	console.error(message);
	process.exit(1);
}

/** @param {string} modname */
async function bundle(modname) {
	let pkgdir = join(packages, modname);
	let pkg = require(join(pkgdir, 'package.json'));
	let files = await fs.promises.readdir(
		join(pkgdir, 'src')
	);

	let externals = [
		pkg.name, ...builtinModules,
		...Object.keys(pkg.dependencies||{}),
		...Object.keys(pkg.peerDependencies||{}),
	];

	if (pkg.exports == null) {
		return bail(`Missing "exports" in module: ${modname}`);
	}

	let outputs = [];
	let encoder = new TextEncoder;

	/**
	 * @param {string} file
	 * @param {Uint8Array|string} content
	 */
	async function write(file, content) {
		await fs.promises.writeFile(file, content);
		if (typeof content === 'string') content = encoder.encode(content);
		outputs.push(utils.inspect(file, content));
	}

	let i=0, isTS=/\.ts$/, tasks=[];
	let overs = overrides[modname] || {};

	for (files.sort(); i < files.length; i++) {
		let file = files[i];
		if (!isTS.test(file)) continue;
		if (file == 'node_modules') continue;
		if (/\.(test|d)\.ts$/.test(file)) continue;

		let dts = file.replace(isTS, '.d.ts');
		files.includes(dts) || bail(`Missing "${dts}" file!`);
		let key = overs[file] || ('./' + file.replace(isTS, ''));

		let entry = pkg.exports[key];
		if (!entry) return bail(`Missing "exports" entry: ${key}`);
		if (!entry.import) return bail(`Missing "import" condition: ${key}`);
		if (!entry.require) return bail(`Missing "require" condition: ${key}`);

		tasks.push(async function () {
			let input = join(pkgdir, 'src', file);
			let output = join(pkgdir, entry.import);

			// build ts -> esm
			let esm = await build({
				bundle: true,
				format: 'esm',
				sourcemap: false,
				entryPoints: [input],
				external: externals,
				outfile: output,
				target: 'es2019',
				treeShaking: true,
				logLevel: 'warning',
				minifyIdentifiers: true,
				minifySyntax: true,
				charset: 'utf8',
				write: false,
			}).then(bundle => {
				return bundle.outputFiles[0];
			});

			let outdir = dirname(esm.path);

			// purge existing directory
			if (fs.existsSync(outdir)) {
				await fs.promises.rm(outdir, {
					recursive: true,
					force: true,
				});
			}

			// create dir (safe writes)
			await fs.promises.mkdir(outdir);
			await write(esm.path, esm.contents);

			// convert esm -> cjs
			output = join(pkgdir, entry.require);
			await write(output, utils.rewrite(esm.text));

			// foo.d.ts -> foo/index.d.ts
			input = join(pkgdir, 'src', dts);
			await write(
				join(outdir, 'index.d.ts'),
				await fs.promises.readFile(input)
			);
		}());
	}

	await Promise.all(tasks);
	utils.table(modname, pkgdir, outputs);
}

/**
 * init
 */
Promise.all([
	bundle('worktop')
]);
