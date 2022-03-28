import { resolve } from 'path';
import * as bundt from 'bundt';

const root = resolve('packages');
const minify = !process.argv.includes('--dev');

let result: bundt.Output = {};

async function run(mod: string) {
	let dir = resolve(root, mod);
	let stats = await bundt.build(dir, { minify });
	Object.assign(result, stats);
}

try {
	var timer = process.hrtime();
	await Promise.all([
		run('create-worktop'),
		run('worktop.build'),
		run('worktop'),
	]);
	timer = process.hrtime(timer);
} catch (err) {
	let msg = (err as Error).stack || err;
	console.error(msg);
	process.exit(1);
}

console.log(
	await bundt.report(result, {
		cwd: root,
		gzip: true,
		delta: timer,
	})
);
