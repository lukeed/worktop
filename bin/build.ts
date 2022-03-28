import { resolve } from 'path';
import { promises as fs } from 'fs';
import * as bundt from 'bundt';

const root = resolve('packages');
const minify = !process.argv.includes('--dev');
const packages = await fs.readdir(root, { withFileTypes: true }).then(list => {
	return list.filter(x => x.isDirectory()).map(x => x.name);
});

let result: bundt.Output = {};
async function run(mod: string) {
	let dir = resolve(root, mod);
	let stats = await bundt.build(dir, { minify });
	Object.assign(result, stats);
}

await Promise.all(
	packages.map(run)
);

console.log(
	await bundt.report(result, {
		cwd: root,
		gzip: true,
	})
);
