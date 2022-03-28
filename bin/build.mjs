import { resolve } from 'path';
import * as bundt from 'bundt';

const root = resolve('packages');
const minify = !process.argv.includes('--dev');

/** @type {bundt.Output} */ let result = {};

/** @param {string} mod */
async function run(mod) {
	let dir = resolve(root, mod);
	let stats = await bundt.build(dir, { minify });
	Object.assign(result, stats);
}

let timer = process.hrtime();

await Promise.all([
	run('create-worktop'),
	run('worktop.build'),
	run('worktop'),
]);

timer = process.hrtime(timer);

console.log(
	await bundt.report(result, {
		cwd: root,
		gzip: true,
		delta: timer,
	})
);
