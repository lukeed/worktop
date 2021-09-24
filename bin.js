#!/usr/bin/env node
const argv = process.argv.slice(2);
const flags = require('mri')(argv, {
	alias: {
		C: 'cwd',
		h: 'help',
		c: 'config',
		f: 'format',
		l: 'loglevel',
		a: 'analyze',
		m: 'minify',
	},
	default: {
		C: '.',
		h: false,
		a: false,
		f: 'module',
		c: 'worktop.config.js',
		l: 'info',
		m: false,
	}
});

/** @param {string} msg */
function bail(msg, code = 1) {
	console.error(msg);
	process.exit(code);
}

function help() {
	let msg = '';
	msg += '\n  Usage';
	msg += '\n    $ worktop build [input] [options]\n';
	msg += '\n  Options';
	msg += '\n    -C, --cwd         Current working directory (default ".")';
	msg += '\n    -c, --config      Path to config file (default "worktop.config.js")';
	msg += '\n    -f, --format      Worker/Script output format (default "module")';
	msg += '\n    -l, --loglevel    Logging display level (default "info")';
	msg += '\n    -a, --analyze     Render bundle output analysis';
	msg += '\n    -m, --minify      Minify built output file(s)';
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
let [cmd, entry] = flags._;
if (cmd && cmd.toLowerCase() !== 'build') {
	bail(`Invalid command: ${cmd}\nPlease run \`worktop --help\` for more information.`);
}

require('.').build({
	config: flags.config,
	input: entry || 'index.ts',
	output: 'build/index.mjs',
	loglevel: flags.loglevel,
	analyze: flags.analyze,
	minify: flags.minify,
	cwd: flags.cwd,
}).catch(err => {
	if (err.errors) process.exitCode = 1;
	else bail(err.stack || err.message);
});
