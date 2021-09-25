// @ts-check
// @see https://github.com/lukeed/bundt/blob/master/index.js
const { white, cyan, dim } = require('kleur');
const rimports = require('rewrite-imports');
const { readFileSync } = require('fs');
const { normalize } = require('path');
const { gzipSync } = require('zlib');

const _ = ' ';
const UNITS = ['B ', 'kB', 'MB', 'GB'];
const lpad = (str, max) => _.repeat(max - str.length) + str;
const rpad = (str, max) => str + _.repeat(max - str.length);
const th = dim().bold().italic().underline;

/**
 * @typedef FileData
 * @property {string} file
 * @property {string} size
 * @property {string} gzip
 */

/**
 * @param {string} file
 * @param {Uint8Array} buffer
 * @returns {FileData}
 */
exports.inspect = function (file, buffer) {
	let gz = gzipSync(buffer).byteLength;
	return {
		file: file,
		gzip: size(gz),
		size: size(buffer.byteLength),
	};
}

function size(val=0) {
	if (val < 1e3) return `${val} ${UNITS[0]}`;
	let exp = Math.min(Math.floor(Math.log10(val) / 3), UNITS.length - 1) || 1;
	let out = (val / Math.pow(1e3, exp)).toPrecision(3);
	let idx = out.indexOf('.');
	if (idx === -1) {
		out += '.00';
	} else if (out.length - idx - 1 !== 2) {
		out = (out + '00').substring(0, idx + 3); // 2 + 1 for 0-based
	}
	return out + ' ' + UNITS[exp];
}

/**
 * @param {string} modname
 * @param {string} pkgdir
 * @param {FileData[]} files
 * @returns {void}
 */
exports.table = function (modname, pkgdir, files) {
	let f=modname.length, s=8, g=6;
	let G1 = _+_, G2 = G1+G1, out='';

	files.sort((a, b) => a.file.localeCompare(b.file)).forEach(obj => {
		obj.file = normalize(
			obj.file.replace(pkgdir, '')
		);

		f = Math.max(f, obj.file.length);
		s = Math.max(s, obj.size.length);
		g = Math.max(g, obj.gzip.length);
	});

	f += 2; // underline extension

	out += G1 + th(rpad(modname, f)) + G2 + th(lpad('Filesize', s)) + G1 + dim().bold().italic(lpad('(gzip)', g));

	files.forEach((obj, idx) => {
		if (idx && idx % 3 === 0) out += '\n';
		out += ('\n' + G1 + white(rpad(obj.file, f)) + G2 + cyan(lpad(obj.size, s)) + G1 + dim().italic(lpad(obj.gzip, g)));
	});

	console.log('\n' + out + '\n');
}

/**
 * @param {string} content The ESM input file
 * @see https://github.com/lukeed/bundt/blob/master/index.js#L131
 * @returns {string}
 */
exports.rewrite = function (content) {
	let footer = '';
	return rimports(content)
		.replace(/(^|\s|;)export default/, '$1module.exports =')
		.replace(/(^|\s|;)export (const|(?:async )?function|class|let|var) (.+?)(?=(\(|\s|\=))/gi, (_, x, type, name) => {
			footer += `\nexports.${name} = ${name};`;
			return `${x}${type} ${name}`;
		})
		.replace(/(^|\s|\n|;?)export \{([\s\S]*?)\};?([\n\s]*?|$)/g, (_, x, names) => {
			names.split(',').forEach(name => {
				let [src, dest] = name.trim().split(/\s+as\s+/);
				footer += `\nexports.${dest || src} = ${src};`;
			});
			return x;
		})
		.concat(
			footer
		);
}
