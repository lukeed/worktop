#!/usr/bin/env node
const argv = require('mri')(process.argv.slice(2), {
	alias: {
		C: 'cwd',
		f: 'force',
		t: 'typescript',
		// m: 'monorepo',
		v: 'version',
		h: 'help',
		c: 'cfw',
	},
	default: {
		C: '.',
		f: false,
	}
});

/** @param {string} msg */
function exit(msg, code = 1) {
	if (code) process.stderr.write(msg + '\n');
	else process.stdout.write(msg + '\n');
	process.exit(code);
}

if (argv.help) {
	let output = '';

	output += '\n  Usage';
	output += '\n    npm init worktop <name> [options]';
	output += '\n';
	output += '\n  Options';
	output += '\n    -C, --cwd          Directory to resolve from';
	output += '\n    -f, --force        Force directory overwrite';
	output += '\n    -t, --typescript   Force directory overwrite';
	// output += '\n    -m, --monorepo     Force directory overwrite';
	output += '\n    -c, --cfw          Force directory overwrite';
	output += '\n    -v, --version      Displays current version';
	output += '\n    -h, --help         Displays this message';
	output += '\n';
	output += '\n  Examples';
	output += '\n    $ npm init worktop my-worker';
	output += '\n    $ yarn create worktop my-worker --force';
	output += '\n';

	exit(output, 0);
}

if (argv.version) {
	console.log('TODO, v0.0.0');
}

(async function () {
	try {
		let dir = argv._.join('-').trim().replace(/[\s_]+/g, '-');
		if (!dir) return exit('Missing <name> argument', 1);
		await require('.').setup(dir, argv);
	} catch (err) {
		exit(err.stack, 1);
	}
})();
