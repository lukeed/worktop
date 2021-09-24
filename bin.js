#!/usr/bin/env node
const argv = process.argv.slice(2);
const flags = require('mri')(argv, {
	alias: {
		C: 'cwd',
		f: 'format',
		l: 'loglevel',
		a: 'analyze',
		m: 'minify',
		h: 'help',
	},
	default: {
		C: '.',
		a: false,
		h: false,
		f: 'module',
		l: 'info',
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
	msg += '\n    -f, --format      Worker/Script output format (default "module")';
	msg += '\n    -l, --loglevel    Logging display level (default "info")';
	msg += '\n    -a, --analyze     Render bundle output analysis';
	msg += '\n    -h, --help        Displays this message\n';
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

let { resolve } = require('path');
let { existsSync } = require('fs');

entry = resolve(flags.cwd, entry);
existsSync(entry) || bail(`Missing file: ${entry}`);

require('.').build({
	input: entry,
	output: 'build/index.mjs',
	loglevel: flags.loglevel,
	analyze: flags.analyze,
	minify: flags.minify,
}).catch(err => {
	bail(err.stack || err.message);
});
