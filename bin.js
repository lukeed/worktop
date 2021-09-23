#!/usr/bin/env node
const argv = process.argv.slice(2);
const flags = require('mri')(argv, {
	alias: {
		C: 'cwd',
		f: 'format',
		m: 'minify',
		h: 'help',
	},
	default: {
		C: '.',
		h: false,
		f: 'module',
		m: false,
	}
});

let [cmd, entry='index.ts'] = flags._;

function bail(msg, code = 1) {
	console.error(msg);
	process.exit(code);
}

function help() {
	let msg = '';
	msg += '\n  Usage';
	msg += '\n    $ worktop build [input] [options]\n';
	msg += '\n  Options';
	msg += '\n    -f, --format   Worker/Script output format (default "module")';
	msg += '\n    -h, --help     Displays this message\n';
	msg += '\n  Examples';
	msg += '\n    $ worktop build';
	msg += '\n    $ worktop build --format sw';
	msg += '\n    $ worktop build --minify --format sw';
	msg += '\n    $ worktop build src/main.ts --format sw';
	console.log(msg + '\n');
	process.exit(0);
}

if (flags.help) help();
if (cmd && cmd.toLowerCase() !== 'build') {
	bail(`Invalid command: ${cmd}\nPlease run \`worktop --help\` for more information.`);
}

const fs = require('fs');
const path = require('path');

const cwd = path.resolve(flags.cwd);

entry = path.join(cwd, entry);
fs.existsSync(entry) || bail(`Missing file: ${entry}`);

// TODO: validate --format and/or --platform combination
// TODO: construct `output` based on combinations

require('.').build({
	input: entry,
	output: 'build/index.mjs',
	minify: !!flags.minify,
	target: 'es2021',
	format: 'esm',
}).then(result => {
	console.log(result);
}).catch(err => {
	bail(err.stack || err.message);
});
