import * as fs from 'fs';
import * as path from 'path';

interface Argv {
	cwd: string;
	force?: boolean;
}

async function mkdir(dir: string) {
	fs.existsSync(dir) || await fs.promises.mkdir(dir, { recursive: true });
}

// @modified lukeed/totalist
type Caller = (abs: string, rel: string, isDir: boolean) => Promise<void>;
async function list(dir: string, callback: Caller, prefix = '') {
	let files = await fs.promises.readdir(dir, { withFileTypes: true });

	await Promise.all(
		files.map(async dirent => {
			let rel = path.join(prefix, dirent.name);
			let item = path.join(dir, dirent.name);
			let isDir = dirent.isDirectory();

			await callback(item, rel, isDir);
			if (isDir) return list(item, callback, rel);
		})
	);
}

async function copy(src: string, dest: string) {
	// "foo/_gitignore" => "foo/.gitignore"
	dest = dest.replace(/([\\/]+)_/, '$1.');
	await fs.promises.copyFile(src, dest);
}

export async function setup(dir: string, argv: Argv) {
	argv.cwd = path.resolve(argv.cwd || '.');

	let source = path.join(__dirname, 'template', 'root');
	let target = path.join(argv.cwd, dir);

	if (fs.existsSync(target) && !argv.force) {
		let pretty = path.relative(process.cwd(), target);
		let msg = `Refusing to overwrite existing "${pretty}" directory.\n`;
		msg += 'Please specify a different directory or use the `--force` flag.';
		throw new Error(msg);
	}

	await mkdir(target);

	await list(source, function (abs, rel, isDir) {
		let next = path.join(target, rel);
		return isDir ? mkdir(next) : copy(abs, next);
	});

	await fs.promises.rename(
		path.join(target, '.package.json'),
		path.join(target, 'package.json'),
	);
}
