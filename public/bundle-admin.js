(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){const a=typeof require=='function'&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);const f=new Error('Cannot find module \''+o+'\'');throw f.code='MODULE_NOT_FOUND',f;}const l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){const n=t[o][1][e];return s(n?n:e);},l,l.exports,e,t,n,r);}return n[o].exports;}var i=typeof require=='function'&&require;for(let o=0;o<r.length;o++)s(r[o]);return s;})({1:[function(require,module,exports){
	const cookieTalk = require('cookie-talk').factory();
	const Receptor = require('../lib/admin/receptor');
	const Api = require('../lib/admin/api');
	const Editor = require('../lib/admin/editor');
	const Save = require('../lib/admin/save');

	const ns = 'admin';

	const receptor = new Receptor(ns);
	const api = new Api(ns);
	const editor = new Editor(document.getElementById('input'));

	const save = new Save(document.getElementById('save'));

},{'../lib/admin/api':2,'../lib/admin/editor':3,'../lib/admin/receptor':4,'../lib/admin/save':5,'cookie-talk':8}],2:[function(require,module,exports){
	const Mitter = require('../mitter');

	module.exports = class Api extends Mitter {
		constructor(ns) {
			super(ns);
			this.on('load.section', (path) => {
				this.load(path, (err, response) =>  {
					if(err) {
						this.emit('load.section.fail', err);
					} else {
						this.emit('load.section.success', {path: path, data: response});
					}
				});
			});

			this.on('save.section', (object) => {
				this.save(object.path, object.data, (err) => {
					if(err) {
						console.err(err);
						this.emit('save.section.fail');
					} else {
						console.log('Done!');
						this.emit('save.section.success');
					}
				});
			});
		}

		load(path, callback) {
			try {
				const req = new XMLHttpRequest();
				req.open('GET', path);
				req.setRequestHeader('Accept', 'text/markdown');
				//req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
				req.onreadystatechange = function() {
					if (req.readyState === XMLHttpRequest.DONE) {
						if (req.status === 200) {
							callback(null, req.response);
						} else {
							callback('Failed: ' + req.status);
						}
					}
				}.bind(this);
				req.send();
			} catch (e) {
				callback(e);
			}
		}

		save(path, value, callback) {
			try {
				const req = new XMLHttpRequest();
				req.open('POST', path);
				req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
				req.onreadystatechange = function() {
					if (req.readyState === XMLHttpRequest.DONE) {
						if (req.status === 200) {
							callback();
							//						console.log('Done');
						} else {
							callback('Failed: ' + req.status);
						//this.emit('api.query.loaded.failed', req.status);
						}
					}
				}.bind(this);
				req.send(JSON.stringify({
					body: value
				}));
			} catch (e) {
			//this.emit('api.query.loaded.failed', e);
				callback(e);
			}
		}
	};

},{'../mitter':6}],3:[function(require,module,exports){
	const Mitter = require('../mitter');
	const CookieTalk = require('cookie-talk').factory();

	module.exports = class Editor extends Mitter {

		constructor(e) {
			super();
			this.path = null;
			this.e = e;
			this.command = new CookieTalk('push-text');
			this.on('load.section.success', (payload) => {
				this.path = payload.path;
				this.e.value = payload.data;
			});

			this.on('save.initiated', () => {
				this.emit('save.section', {
					path: this.path,
					data: this.e.value
				});
			});

			this.e.addEventListener('keyup', (e) => {
				this.command.send(JSON.stringify({
					path: this.path,
					data: this.e.value
				}), function() {
					console.log('Data pushed');
				});
			});
		}

	};

},{'../mitter':6,'cookie-talk':8}],4:[function(require,module,exports){
	const Mitter = require('../mitter');
	const CookieTalk = require('cookie-talk').factory();

	module.exports = class Receptor extends Mitter {

		constructor(ns) {
			super(ns);
			this.command = new CookieTalk('command-up');
			this.command.onMessage(function(message) {
				this.emit('load.section', message);
			}.bind(this));
		}
	};

},{'../mitter':6,'cookie-talk':8}],5:[function(require,module,exports){
	const Mitter = require('../mitter');

	module.exports = class Save extends Mitter {

		constructor(e) {
			super();
			this.path = null;
			this.e = e;
			this.e.addEventListener('click', (e) => {
				this.emit('save.initiated', function() {
					console.log('Save initiated');
				});
			});

			this.on('save.section', () => {
				this.e.disabled = true;
			});

			this.on('save.section.success', () => {
				this.e.disabled = false;
			});

			this.on('save.section.fail', () => {
				this.e.disabled = false;
			});
		}
	};

},{'../mitter':6}],6:[function(require,module,exports){
	module.exports = class Mitter {
	
		constructor() {
			this.globalNS = '__customEventRegsiter';
		}

		emit(namespace, payload, sync = false) {
			if (window[this.globalNS] && window[this.globalNS][namespace]) {
				for (let x = 0; x < window[this.globalNS][namespace].length; x++) {
					if (sync) {
						window[this.globalNS][namespace][x](payload);
					} else {
						setTimeout(function() {
							this.method(this.payload);
						}.bind({
							method: window[this.globalNS][namespace][x],
							payload: payload
						}), 0);
					}
				}
			}
		}

		on(namespace, func) {
			if (!window[this.globalNS]) {
				window[this.globalNS] = {};
			}
			if (!window[this.globalNS][namespace]) {
				window[this.globalNS][namespace] = [];
			}
			window[this.globalNS][namespace].push(func);
		}
	};

// const mitt = require('mitt');
// module.exports = class mitter {
// 	constructor(channel = 'default') {
// 		this.h = mitt();
// 		this.channel = channel;
// 	}
//
// 	emit(type, val) {
// 		console.log('Emit', type);
// 		this.h.emit(type, val)
// 	}
//
// 	on(type, handler) {
// 		console.log('On', type, handler);
// 		this.h.on(type, handler)
// 	}
//
// 	off(type, handler) {
// 		this.h.off(type, handler);
// 	}
// }

},{}],7:[function(require,module,exports){
	const c = require('./lib/cookie');
	const Base64 = require('js-base64').Base64;


	module.exports = function(channel) {

		this.channel = channel;
		this.cookie = c;
		this.interval = 1;


		this.send = function(message, cb) {
			this.cookie.erase(this.channel);
			message = Base64.encode(message);
			const chunk = 1000;
			let c = 0;
			var i = setInterval(function() {
				const tmp = this.cookie.read(this.channel);
				if(!tmp) {
					const piece = String(message).substring(c * chunk, (c + 1) * chunk);
					this.cookie.create(this.channel, piece);
					if(message.length <= (c + 1) * chunk) {
						this.cookie.create(this.channel + '-ack', true);
						clearInterval(i);
						cb();
					} else {
						c++;
					}
				}
			}.bind(this), this.interval);
		};

		this.clear = function() {
			this.cookie.erase(this.channel);
		};

		this.onMessage = function(cb) {
			let buffer = [];
			const i = setInterval(function(){
				const x = this.cookie.read(this.channel);
				if(x) {
					buffer.push(x);
					this.cookie.erase(this.channel);
				} else {
					if(this.cookie.read(this.channel + '-ack')) {
						this.cookie.erase(this.channel + '-ack');
						cb(Base64.decode(buffer.join()));
						buffer = [];
					}
				}
			}.bind(this), this.interval);
		};

	};

},{'./lib/cookie':9,'js-base64':11}],8:[function(require,module,exports){
	const cookieTalk = {

		cookie: require('./cookie'),

		storage: require('./storage'),

		factory: function(hint) {
			if(hint === 'storage') {
				return this.storage;
			} else if(hint === 'cookie') {
				return this.cookie;
			}

			if(localStorage) {
				return this.storage;
			} else {
				return this.cookie;
			}
		}
	};

	module.exports = cookieTalk;

},{'./cookie':7,'./storage':10}],9:[function(require,module,exports){
	module.exports = {
		create: function(name, value, days) {
			if (days) {
				const date = new Date();
				date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
				var expires = '; expires=' + date.toGMTString();
			} else var expires = '';
			document.cookie = name + '=' + value + expires + '; path=/';
		},
		read: function(name) {
			const nameEQ = name + '=';
			const ca = document.cookie.split(';');
			for (let i = 0; i < ca.length; i++) {
				let c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
			}
			return null;
		},
		erase: function(name) {
			this.create(name, '', -1);
		}
	};

},{}],10:[function(require,module,exports){
	module.exports = function(channel) {

		this.channel = channel;
		this.interval = 1;
		this.buffer = [];
		this.store = localStorage;

		let semaphore = false;
		setInterval(function() {
			if(!semaphore) {
				semaphore = true;
				if(this.buffer.length && !this.store.getItem(this.channel)) {
					const m = this.buffer.shift();
					this.store.setItem(this.channel, m[0]);
					if(typeof m[1] === 'function') {
						m[1]();
					}
				}
				semaphore = false;
			}
		}.bind(this));

		this.clear = function() {
			this.store.removeItem(this.channel);
		};

		this.send = function(message, cb) {
			this.buffer.push([message, cb]);
		};

		this.onMessage = function(cb) {
			setInterval(function(){
				const m = this.store.getItem(this.channel);
				if(m !== null) {
					this.store.removeItem(this.channel);
					if(typeof cb === 'function') {
						cb(m);
					}
				}
			}.bind(this));
		};
	};

},{}],11:[function(require,module,exports){
/*
 * $Id: base64.js,v 2.15 2014/04/05 12:58:57 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

	(function(global) {
		'use strict';
		// existing version for noConflict()
		const _Base64 = global.Base64;
		const version = '2.1.9';
		// if node.js, we use Buffer
		let buffer;
		if (typeof module !== 'undefined' && module.exports) {
			try {
				buffer = require('buffer').Buffer;
			} catch (err) {}
		}
		// constants
		const b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		const b64tab = function(bin) {
			const t = {};
			for (let i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
			return t;
		}(b64chars);
		const fromCharCode = String.fromCharCode;
		// encoder stuff
		const cb_utob = function(c) {
			if (c.length < 2) {
				var cc = c.charCodeAt(0);
				return cc < 0x80 ? c
					: cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
						: (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
			} else {
				var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
				return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
			}
		};
		const re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
		const utob = function(u) {
			return u.replace(re_utob, cb_utob);
		};
		const cb_encode = function(ccc) {
			let padlen = [0, 2, 1][ccc.length % 3],
				ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
				chars = [
					b64chars.charAt( ord >>> 18),
					b64chars.charAt((ord >>> 12) & 63),
					padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
					padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
				];
			return chars.join('');
		};
		const btoa = global.btoa ? function(b) {
			return global.btoa(b);
		} : function(b) {
			return b.replace(/[\s\S]{1,3}/g, cb_encode);
		};
		const _encode = buffer ? function (u) {
			return (u.constructor === buffer.constructor ? u : new buffer(u))
				.toString('base64');
		}
			: function (u) { return btoa(utob(u)); }
    ;
		const encode = function(u, urisafe) {
			return !urisafe
				? _encode(String(u))
				: _encode(String(u)).replace(/[+\/]/g, function(m0) {
					return m0 == '+' ? '-' : '_';
				}).replace(/=/g, '');
		};
		const encodeURI = function(u) { return encode(u, true); };
		// decoder stuff
		const re_btou = new RegExp([
			'[\xC0-\xDF][\x80-\xBF]',
			'[\xE0-\xEF][\x80-\xBF]{2}',
			'[\xF0-\xF7][\x80-\xBF]{3}'
		].join('|'), 'g');
		const cb_btou = function(cccc) {
			switch(cccc.length) {
			case 4:
				var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
					offset = cp - 0x10000;
				return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
			case 3:
				return fromCharCode(
					((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
				);
			default:
				return  fromCharCode(
					((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
				);
			}
		};
		const btou = function(b) {
			return b.replace(re_btou, cb_btou);
		};
		const cb_decode = function(cccc) {
			let len = cccc.length,
				padlen = len % 4,
				n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
				chars = [
					fromCharCode( n >>> 16),
					fromCharCode((n >>>  8) & 0xff),
					fromCharCode( n         & 0xff)
				];
			chars.length -= [0, 0, 2, 1][padlen];
			return chars.join('');
		};
		const atob = global.atob ? function(a) {
			return global.atob(a);
		} : function(a){
			return a.replace(/[\s\S]{1,4}/g, cb_decode);
		};
		const _decode = buffer ? function(a) {
			return (a.constructor === buffer.constructor
				? a : new buffer(a, 'base64')).toString();
		}
			: function(a) { return btou(atob(a)); };
		const decode = function(a){
			return _decode(
				String(a).replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/'; })
					.replace(/[^A-Za-z0-9\+\/]/g, '')
			);
		};
		const noConflict = function() {
			const Base64 = global.Base64;
			global.Base64 = _Base64;
			return Base64;
		};
		// export Base64
		global.Base64 = {
			VERSION: version,
			atob: atob,
			btoa: btoa,
			fromBase64: decode,
			toBase64: encode,
			utob: utob,
			encode: encode,
			encodeURI: encodeURI,
			btou: btou,
			decode: decode,
			noConflict: noConflict
		};
		// if ES5 is available, make Base64.extendString() available
		if (typeof Object.defineProperty === 'function') {
			const noEnum = function(v){
				return {value:v,enumerable:false,writable:true,configurable:true};
			};
			global.Base64.extendString = function () {
				Object.defineProperty(
					String.prototype, 'fromBase64', noEnum(function () {
						return decode(this);
					}));
				Object.defineProperty(
					String.prototype, 'toBase64', noEnum(function (urisafe) {
						return encode(this, urisafe);
					}));
				Object.defineProperty(
					String.prototype, 'toBase64URI', noEnum(function () {
						return encode(this, true);
					}));
			};
		}
		// that's it!
		if (global['Meteor']) {
			Base64 = global.Base64; // for normal export in Meteor.js
		}
	})(this);

},{'buffer':13}],12:[function(require,module,exports){
	'use strict';

	exports.byteLength = byteLength;
	exports.toByteArray = toByteArray;
	exports.fromByteArray = fromByteArray;

	const lookup = [];
	const revLookup = [];
	const Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

	const code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	for (let i = 0, len = code.length; i < len; ++i) {
		lookup[i] = code[i];
		revLookup[code.charCodeAt(i)] = i;
	}

	revLookup['-'.charCodeAt(0)] = 62;
	revLookup['_'.charCodeAt(0)] = 63;

	function placeHoldersCount (b64) {
		const len = b64.length;
		if (len % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4');
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;
	}

	function byteLength (b64) {
		// base64 is 4/3 + up to two characters of the original data
		return b64.length * 3 / 4 - placeHoldersCount(b64);
	}

	function toByteArray (b64) {
		let i, j, l, tmp, placeHolders, arr;
		const len = b64.length;
		placeHolders = placeHoldersCount(b64);

		arr = new Arr(len * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? len - 4 : len;

		let L = 0;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
			arr[L++] = (tmp >> 16) & 0xFF;
			arr[L++] = (tmp >> 8) & 0xFF;
			arr[L++] = tmp & 0xFF;
		}

		if (placeHolders === 2) {
			tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
			arr[L++] = tmp & 0xFF;
		} else if (placeHolders === 1) {
			tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
			arr[L++] = (tmp >> 8) & 0xFF;
			arr[L++] = tmp & 0xFF;
		}

		return arr;
	}

	function tripletToBase64 (num) {
		return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
	}

	function encodeChunk (uint8, start, end) {
		let tmp;
		const output = [];
		for (let i = start; i < end; i += 3) {
			tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output.push(tripletToBase64(tmp));
		}
		return output.join('');
	}

	function fromByteArray (uint8) {
		let tmp;
		const len = uint8.length;
		const extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
		let output = '';
		const parts = [];
		const maxChunkLength = 16383; // must be multiple of 3

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
			parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		if (extraBytes === 1) {
			tmp = uint8[len - 1];
			output += lookup[tmp >> 2];
			output += lookup[(tmp << 4) & 0x3F];
			output += '==';
		} else if (extraBytes === 2) {
			tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
			output += lookup[tmp >> 10];
			output += lookup[(tmp >> 4) & 0x3F];
			output += lookup[(tmp << 2) & 0x3F];
			output += '=';
		}

		parts.push(output);

		return parts.join('');
	}

},{}],13:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

	'use strict';

	const base64 = require('base64-js');
	const ieee754 = require('ieee754');

	exports.Buffer = Buffer;
	exports.SlowBuffer = SlowBuffer;
	exports.INSPECT_MAX_BYTES = 50;

	const K_MAX_LENGTH = 0x7fffffff;
	exports.kMaxLength = K_MAX_LENGTH;

	/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
	Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

	if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
		console.error(
			'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
		);
	}

	function typedArraySupport () {
		// Can typed array instances can be augmented?
		try {
			const arr = new Uint8Array(1);
			arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42; }};
			return arr.foo() === 42;
		} catch (e) {
			return false;
		}
	}

	function createBuffer (length) {
		if (length > K_MAX_LENGTH) {
			throw new RangeError('Invalid typed array length');
		}
		// Return an augmented `Uint8Array` instance
		const buf = new Uint8Array(length);
		buf.__proto__ = Buffer.prototype;
		return buf;
	}

	/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

	function Buffer (arg, encodingOrOffset, length) {
		// Common case.
		if (typeof arg === 'number') {
			if (typeof encodingOrOffset === 'string') {
				throw new Error(
					'If encoding is specified then the first argument must be a string'
				);
			}
			return allocUnsafe(arg);
		}
		return from(arg, encodingOrOffset, length);
	}

	// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
		Object.defineProperty(Buffer, Symbol.species, {
			value: null,
			configurable: true,
			enumerable: false,
			writable: false
		});
	}

	Buffer.poolSize = 8192; // not used by this implementation

	function from (value, encodingOrOffset, length) {
		if (typeof value === 'number') {
			throw new TypeError('"value" argument must not be a number');
		}

		if (value instanceof ArrayBuffer) {
			return fromArrayBuffer(value, encodingOrOffset, length);
		}

		if (typeof value === 'string') {
			return fromString(value, encodingOrOffset);
		}

		return fromObject(value);
	}

	/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
	Buffer.from = function (value, encodingOrOffset, length) {
		return from(value, encodingOrOffset, length);
	};

	// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
	// https://github.com/feross/buffer/pull/148
	Buffer.prototype.__proto__ = Uint8Array.prototype;
	Buffer.__proto__ = Uint8Array;

	function assertSize (size) {
		if (typeof size !== 'number') {
			throw new TypeError('"size" argument must be a number');
		} else if (size < 0) {
			throw new RangeError('"size" argument must not be negative');
		}
	}

	function alloc (size, fill, encoding) {
		assertSize(size);
		if (size <= 0) {
			return createBuffer(size);
		}
		if (fill !== undefined) {
			// Only pay attention to encoding if it's a string. This
			// prevents accidentally sending in a number that would
			// be interpretted as a start offset.
			return typeof encoding === 'string'
				? createBuffer(size).fill(fill, encoding)
				: createBuffer(size).fill(fill);
		}
		return createBuffer(size);
	}

	/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
	Buffer.alloc = function (size, fill, encoding) {
		return alloc(size, fill, encoding);
	};

	function allocUnsafe (size) {
		assertSize(size);
		return createBuffer(size < 0 ? 0 : checked(size) | 0);
	}

	/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
	Buffer.allocUnsafe = function (size) {
		return allocUnsafe(size);
	};
	/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
	Buffer.allocUnsafeSlow = function (size) {
		return allocUnsafe(size);
	};

	function fromString (string, encoding) {
		if (typeof encoding !== 'string' || encoding === '') {
			encoding = 'utf8';
		}

		if (!Buffer.isEncoding(encoding)) {
			throw new TypeError('"encoding" must be a valid string encoding');
		}

		const length = byteLength(string, encoding) | 0;
		let buf = createBuffer(length);

		const actual = buf.write(string, encoding);

		if (actual !== length) {
			// Writing a hex string, for example, that contains invalid characters will
			// cause everything after the first invalid character to be ignored. (e.g.
			// 'abxxcd' will be treated as 'ab')
			buf = buf.slice(0, actual);
		}

		return buf;
	}

	function fromArrayLike (array) {
		const length = array.length < 0 ? 0 : checked(array.length) | 0;
		const buf = createBuffer(length);
		for (let i = 0; i < length; i += 1) {
			buf[i] = array[i] & 255;
		}
		return buf;
	}

	function fromArrayBuffer (array, byteOffset, length) {
		if (byteOffset < 0 || array.byteLength < byteOffset) {
			throw new RangeError('\'offset\' is out of bounds');
		}

		if (array.byteLength < byteOffset + (length || 0)) {
			throw new RangeError('\'length\' is out of bounds');
		}

		let buf;
		if (byteOffset === undefined && length === undefined) {
			buf = new Uint8Array(array);
		} else if (length === undefined) {
			buf = new Uint8Array(array, byteOffset);
		} else {
			buf = new Uint8Array(array, byteOffset, length);
		}

		// Return an augmented `Uint8Array` instance
		buf.__proto__ = Buffer.prototype;
		return buf;
	}

	function fromObject (obj) {
		if (Buffer.isBuffer(obj)) {
			const len = checked(obj.length) | 0;
			const buf = createBuffer(len);

			if (buf.length === 0) {
				return buf;
			}

			obj.copy(buf, 0, 0, len);
			return buf;
		}

		if (obj) {
			if (isArrayBufferView(obj) || 'length' in obj) {
				if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
					return createBuffer(0);
				}
				return fromArrayLike(obj);
			}

			if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
				return fromArrayLike(obj.data);
			}
		}

		throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
	}

	function checked (length) {
		// Note: cannot use `length < K_MAX_LENGTH` here because that fails when
		// length is NaN (which is otherwise coerced to zero.)
		if (length >= K_MAX_LENGTH) {
			throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
		}
		return length | 0;
	}

	function SlowBuffer (length) {
		if (+length != length) { // eslint-disable-line eqeqeq
			length = 0;
		}
		return Buffer.alloc(+length);
	}

	Buffer.isBuffer = function isBuffer (b) {
		return b != null && b._isBuffer === true;
	};

	Buffer.compare = function compare (a, b) {
		if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
			throw new TypeError('Arguments must be Buffers');
		}

		if (a === b) return 0;

		let x = a.length;
		let y = b.length;

		for (let i = 0, len = Math.min(x, y); i < len; ++i) {
			if (a[i] !== b[i]) {
				x = a[i];
				y = b[i];
				break;
			}
		}

		if (x < y) return -1;
		if (y < x) return 1;
		return 0;
	};

	Buffer.isEncoding = function isEncoding (encoding) {
		switch (String(encoding).toLowerCase()) {
		case 'hex':
		case 'utf8':
		case 'utf-8':
		case 'ascii':
		case 'latin1':
		case 'binary':
		case 'base64':
		case 'ucs2':
		case 'ucs-2':
		case 'utf16le':
		case 'utf-16le':
			return true;
		default:
			return false;
		}
	};

	Buffer.concat = function concat (list, length) {
		if (!Array.isArray(list)) {
			throw new TypeError('"list" argument must be an Array of Buffers');
		}

		if (list.length === 0) {
			return Buffer.alloc(0);
		}

		let i;
		if (length === undefined) {
			length = 0;
			for (i = 0; i < list.length; ++i) {
				length += list[i].length;
			}
		}

		const buffer = Buffer.allocUnsafe(length);
		let pos = 0;
		for (i = 0; i < list.length; ++i) {
			const buf = list[i];
			if (!Buffer.isBuffer(buf)) {
				throw new TypeError('"list" argument must be an Array of Buffers');
			}
			buf.copy(buffer, pos);
			pos += buf.length;
		}
		return buffer;
	};

	function byteLength (string, encoding) {
		if (Buffer.isBuffer(string)) {
			return string.length;
		}
		if (isArrayBufferView(string) || string instanceof ArrayBuffer) {
			return string.byteLength;
		}
		if (typeof string !== 'string') {
			string = '' + string;
		}

		const len = string.length;
		if (len === 0) return 0;

		// Use a for loop to avoid recursion
		let loweredCase = false;
		for (;;) {
			switch (encoding) {
			case 'ascii':
			case 'latin1':
			case 'binary':
				return len;
			case 'utf8':
			case 'utf-8':
			case undefined:
				return utf8ToBytes(string).length;
			case 'ucs2':
			case 'ucs-2':
			case 'utf16le':
			case 'utf-16le':
				return len * 2;
			case 'hex':
				return len >>> 1;
			case 'base64':
				return base64ToBytes(string).length;
			default:
				if (loweredCase) return utf8ToBytes(string).length; // assume utf8
				encoding = ('' + encoding).toLowerCase();
				loweredCase = true;
			}
		}
	}
	Buffer.byteLength = byteLength;

	function slowToString (encoding, start, end) {
		let loweredCase = false;

		// No need to verify that "this.length <= MAX_UINT32" since it's a read-only
		// property of a typed array.

		// This behaves neither like String nor Uint8Array in that we set start/end
		// to their upper/lower bounds if the value passed is out of range.
		// undefined is handled specially as per ECMA-262 6th Edition,
		// Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
		if (start === undefined || start < 0) {
			start = 0;
		}
		// Return early if start > this.length. Done here to prevent potential uint32
		// coercion fail below.
		if (start > this.length) {
			return '';
		}

		if (end === undefined || end > this.length) {
			end = this.length;
		}

		if (end <= 0) {
			return '';
		}

		// Force coersion to uint32. This will also coerce falsey/NaN values to 0.
		end >>>= 0;
		start >>>= 0;

		if (end <= start) {
			return '';
		}

		if (!encoding) encoding = 'utf8';

		while (true) {
			switch (encoding) {
			case 'hex':
				return hexSlice(this, start, end);

			case 'utf8':
			case 'utf-8':
				return utf8Slice(this, start, end);

			case 'ascii':
				return asciiSlice(this, start, end);

			case 'latin1':
			case 'binary':
				return latin1Slice(this, start, end);

			case 'base64':
				return base64Slice(this, start, end);

			case 'ucs2':
			case 'ucs-2':
			case 'utf16le':
			case 'utf-16le':
				return utf16leSlice(this, start, end);

			default:
				if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
				encoding = (encoding + '').toLowerCase();
				loweredCase = true;
			}
		}
	}

	// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
	// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
	// reliably in a browserify context because there could be multiple different
	// copies of the 'buffer' package in use. This method works even for Buffer
	// instances that were created from another copy of the `buffer` package.
	// See: https://github.com/feross/buffer/issues/154
	Buffer.prototype._isBuffer = true;

	function swap (b, n, m) {
		const i = b[n];
		b[n] = b[m];
		b[m] = i;
	}

	Buffer.prototype.swap16 = function swap16 () {
		const len = this.length;
		if (len % 2 !== 0) {
			throw new RangeError('Buffer size must be a multiple of 16-bits');
		}
		for (let i = 0; i < len; i += 2) {
			swap(this, i, i + 1);
		}
		return this;
	};

	Buffer.prototype.swap32 = function swap32 () {
		const len = this.length;
		if (len % 4 !== 0) {
			throw new RangeError('Buffer size must be a multiple of 32-bits');
		}
		for (let i = 0; i < len; i += 4) {
			swap(this, i, i + 3);
			swap(this, i + 1, i + 2);
		}
		return this;
	};

	Buffer.prototype.swap64 = function swap64 () {
		const len = this.length;
		if (len % 8 !== 0) {
			throw new RangeError('Buffer size must be a multiple of 64-bits');
		}
		for (let i = 0; i < len; i += 8) {
			swap(this, i, i + 7);
			swap(this, i + 1, i + 6);
			swap(this, i + 2, i + 5);
			swap(this, i + 3, i + 4);
		}
		return this;
	};

	Buffer.prototype.toString = function toString () {
		const length = this.length;
		if (length === 0) return '';
		if (arguments.length === 0) return utf8Slice(this, 0, length);
		return slowToString.apply(this, arguments);
	};

	Buffer.prototype.equals = function equals (b) {
		if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
		if (this === b) return true;
		return Buffer.compare(this, b) === 0;
	};

	Buffer.prototype.inspect = function inspect () {
		let str = '';
		const max = exports.INSPECT_MAX_BYTES;
		if (this.length > 0) {
			str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
			if (this.length > max) str += ' ... ';
		}
		return '<Buffer ' + str + '>';
	};

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
		if (!Buffer.isBuffer(target)) {
			throw new TypeError('Argument must be a Buffer');
		}

		if (start === undefined) {
			start = 0;
		}
		if (end === undefined) {
			end = target ? target.length : 0;
		}
		if (thisStart === undefined) {
			thisStart = 0;
		}
		if (thisEnd === undefined) {
			thisEnd = this.length;
		}

		if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
			throw new RangeError('out of range index');
		}

		if (thisStart >= thisEnd && start >= end) {
			return 0;
		}
		if (thisStart >= thisEnd) {
			return -1;
		}
		if (start >= end) {
			return 1;
		}

		start >>>= 0;
		end >>>= 0;
		thisStart >>>= 0;
		thisEnd >>>= 0;

		if (this === target) return 0;

		let x = thisEnd - thisStart;
		let y = end - start;
		const len = Math.min(x, y);

		const thisCopy = this.slice(thisStart, thisEnd);
		const targetCopy = target.slice(start, end);

		for (let i = 0; i < len; ++i) {
			if (thisCopy[i] !== targetCopy[i]) {
				x = thisCopy[i];
				y = targetCopy[i];
				break;
			}
		}

		if (x < y) return -1;
		if (y < x) return 1;
		return 0;
	};

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
		// Empty buffer means no match
		if (buffer.length === 0) return -1;

		// Normalize byteOffset
		if (typeof byteOffset === 'string') {
			encoding = byteOffset;
			byteOffset = 0;
		} else if (byteOffset > 0x7fffffff) {
			byteOffset = 0x7fffffff;
		} else if (byteOffset < -0x80000000) {
			byteOffset = -0x80000000;
		}
		byteOffset = +byteOffset;  // Coerce to Number.
		if (numberIsNaN(byteOffset)) {
			// byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
			byteOffset = dir ? 0 : (buffer.length - 1);
		}

		// Normalize byteOffset: negative offsets start from the end of the buffer
		if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
		if (byteOffset >= buffer.length) {
			if (dir) return -1;
			else byteOffset = buffer.length - 1;
		} else if (byteOffset < 0) {
			if (dir) byteOffset = 0;
			else return -1;
		}

		// Normalize val
		if (typeof val === 'string') {
			val = Buffer.from(val, encoding);
		}

		// Finally, search either indexOf (if dir is true) or lastIndexOf
		if (Buffer.isBuffer(val)) {
			// Special case: looking for empty string/buffer always fails
			if (val.length === 0) {
				return -1;
			}
			return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
		} else if (typeof val === 'number') {
			val = val & 0xFF; // Search for a byte value [0-255]
			if (typeof Uint8Array.prototype.indexOf === 'function') {
				if (dir) {
					return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
				} else {
					return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
				}
			}
			return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir);
		}

		throw new TypeError('val must be string, number or Buffer');
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
		let indexSize = 1;
		let arrLength = arr.length;
		let valLength = val.length;

		if (encoding !== undefined) {
			encoding = String(encoding).toLowerCase();
			if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
				if (arr.length < 2 || val.length < 2) {
					return -1;
				}
				indexSize = 2;
				arrLength /= 2;
				valLength /= 2;
				byteOffset /= 2;
			}
		}

		function read (buf, i) {
			if (indexSize === 1) {
				return buf[i];
			} else {
				return buf.readUInt16BE(i * indexSize);
			}
		}

		let i;
		if (dir) {
			let foundIndex = -1;
			for (i = byteOffset; i < arrLength; i++) {
				if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
					if (foundIndex === -1) foundIndex = i;
					if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
				} else {
					if (foundIndex !== -1) i -= i - foundIndex;
					foundIndex = -1;
				}
			}
		} else {
			if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
			for (i = byteOffset; i >= 0; i--) {
				let found = true;
				for (let j = 0; j < valLength; j++) {
					if (read(arr, i + j) !== read(val, j)) {
						found = false;
						break;
					}
				}
				if (found) return i;
			}
		}

		return -1;
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
		return this.indexOf(val, byteOffset, encoding) !== -1;
	};

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
		return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
	};

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
		return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
	};

	function hexWrite (buf, string, offset, length) {
		offset = Number(offset) || 0;
		const remaining = buf.length - offset;
		if (!length) {
			length = remaining;
		} else {
			length = Number(length);
			if (length > remaining) {
				length = remaining;
			}
		}

		// must be an even number of digits
		const strLen = string.length;
		if (strLen % 2 !== 0) throw new TypeError('Invalid hex string');

		if (length > strLen / 2) {
			length = strLen / 2;
		}
		for (var i = 0; i < length; ++i) {
			const parsed = parseInt(string.substr(i * 2, 2), 16);
			if (numberIsNaN(parsed)) return i;
			buf[offset + i] = parsed;
		}
		return i;
	}

	function utf8Write (buf, string, offset, length) {
		return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
	}

	function asciiWrite (buf, string, offset, length) {
		return blitBuffer(asciiToBytes(string), buf, offset, length);
	}

	function latin1Write (buf, string, offset, length) {
		return asciiWrite(buf, string, offset, length);
	}

	function base64Write (buf, string, offset, length) {
		return blitBuffer(base64ToBytes(string), buf, offset, length);
	}

	function ucs2Write (buf, string, offset, length) {
		return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
		// Buffer#write(string)
		if (offset === undefined) {
			encoding = 'utf8';
			length = this.length;
			offset = 0;
			// Buffer#write(string, encoding)
		} else if (length === undefined && typeof offset === 'string') {
			encoding = offset;
			length = this.length;
			offset = 0;
			// Buffer#write(string, offset[, length][, encoding])
		} else if (isFinite(offset)) {
			offset = offset >>> 0;
			if (isFinite(length)) {
				length = length >>> 0;
				if (encoding === undefined) encoding = 'utf8';
			} else {
				encoding = length;
				length = undefined;
			}
		} else {
			throw new Error(
				'Buffer.write(string, encoding, offset[, length]) is no longer supported'
			);
		}

		const remaining = this.length - offset;
		if (length === undefined || length > remaining) length = remaining;

		if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
			throw new RangeError('Attempt to write outside buffer bounds');
		}

		if (!encoding) encoding = 'utf8';

		let loweredCase = false;
		for (;;) {
			switch (encoding) {
			case 'hex':
				return hexWrite(this, string, offset, length);

			case 'utf8':
			case 'utf-8':
				return utf8Write(this, string, offset, length);

			case 'ascii':
				return asciiWrite(this, string, offset, length);

			case 'latin1':
			case 'binary':
				return latin1Write(this, string, offset, length);

			case 'base64':
				// Warning: maxLength not taken into account in base64Write
				return base64Write(this, string, offset, length);

			case 'ucs2':
			case 'ucs-2':
			case 'utf16le':
			case 'utf-16le':
				return ucs2Write(this, string, offset, length);

			default:
				if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
				encoding = ('' + encoding).toLowerCase();
				loweredCase = true;
			}
		}
	};

	Buffer.prototype.toJSON = function toJSON () {
		return {
			type: 'Buffer',
			data: Array.prototype.slice.call(this._arr || this, 0)
		};
	};

	function base64Slice (buf, start, end) {
		if (start === 0 && end === buf.length) {
			return base64.fromByteArray(buf);
		} else {
			return base64.fromByteArray(buf.slice(start, end));
		}
	}

	function utf8Slice (buf, start, end) {
		end = Math.min(buf.length, end);
		const res = [];

		let i = start;
		while (i < end) {
			const firstByte = buf[i];
			let codePoint = null;
			let bytesPerSequence = (firstByte > 0xEF) ? 4
				: (firstByte > 0xDF) ? 3
					: (firstByte > 0xBF) ? 2
						: 1;

			if (i + bytesPerSequence <= end) {
				var secondByte, thirdByte, fourthByte, tempCodePoint;

				switch (bytesPerSequence) {
				case 1:
					if (firstByte < 0x80) {
						codePoint = firstByte;
					}
					break;
				case 2:
					secondByte = buf[i + 1];
					if ((secondByte & 0xC0) === 0x80) {
						tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
						if (tempCodePoint > 0x7F) {
							codePoint = tempCodePoint;
						}
					}
					break;
				case 3:
					secondByte = buf[i + 1];
					thirdByte = buf[i + 2];
					if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
						tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
						if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
							codePoint = tempCodePoint;
						}
					}
					break;
				case 4:
					secondByte = buf[i + 1];
					thirdByte = buf[i + 2];
					fourthByte = buf[i + 3];
					if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
						tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
						if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
							codePoint = tempCodePoint;
						}
					}
				}
			}

			if (codePoint === null) {
				// we did not generate a valid codePoint so insert a
				// replacement char (U+FFFD) and advance only 1 byte
				codePoint = 0xFFFD;
				bytesPerSequence = 1;
			} else if (codePoint > 0xFFFF) {
				// encode to utf16 (surrogate pair dance)
				codePoint -= 0x10000;
				res.push(codePoint >>> 10 & 0x3FF | 0xD800);
				codePoint = 0xDC00 | codePoint & 0x3FF;
			}

			res.push(codePoint);
			i += bytesPerSequence;
		}

		return decodeCodePointsArray(res);
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	const MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray (codePoints) {
		const len = codePoints.length;
		if (len <= MAX_ARGUMENTS_LENGTH) {
			return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
		}

		// Decode in chunks to avoid "call stack size exceeded".
		let res = '';
		let i = 0;
		while (i < len) {
			res += String.fromCharCode.apply(
				String,
				codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
			);
		}
		return res;
	}

	function asciiSlice (buf, start, end) {
		let ret = '';
		end = Math.min(buf.length, end);

		for (let i = start; i < end; ++i) {
			ret += String.fromCharCode(buf[i] & 0x7F);
		}
		return ret;
	}

	function latin1Slice (buf, start, end) {
		let ret = '';
		end = Math.min(buf.length, end);

		for (let i = start; i < end; ++i) {
			ret += String.fromCharCode(buf[i]);
		}
		return ret;
	}

	function hexSlice (buf, start, end) {
		const len = buf.length;

		if (!start || start < 0) start = 0;
		if (!end || end < 0 || end > len) end = len;

		let out = '';
		for (let i = start; i < end; ++i) {
			out += toHex(buf[i]);
		}
		return out;
	}

	function utf16leSlice (buf, start, end) {
		const bytes = buf.slice(start, end);
		let res = '';
		for (let i = 0; i < bytes.length; i += 2) {
			res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256));
		}
		return res;
	}

	Buffer.prototype.slice = function slice (start, end) {
		const len = this.length;
		start = ~~start;
		end = end === undefined ? len : ~~end;

		if (start < 0) {
			start += len;
			if (start < 0) start = 0;
		} else if (start > len) {
			start = len;
		}

		if (end < 0) {
			end += len;
			if (end < 0) end = 0;
		} else if (end > len) {
			end = len;
		}

		if (end < start) end = start;

		const newBuf = this.subarray(start, end);
		// Return an augmented `Uint8Array` instance
		newBuf.__proto__ = Buffer.prototype;
		return newBuf;
	};

	/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
	function checkOffset (offset, ext, length) {
		if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint');
		if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
		offset = offset >>> 0;
		byteLength = byteLength >>> 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);

		let val = this[offset];
		let mul = 1;
		let i = 0;
		while (++i < byteLength && (mul *= 0x100)) {
			val += this[offset + i] * mul;
		}

		return val;
	};

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
		offset = offset >>> 0;
		byteLength = byteLength >>> 0;
		if (!noAssert) {
			checkOffset(offset, byteLength, this.length);
		}

		let val = this[offset + --byteLength];
		let mul = 1;
		while (byteLength > 0 && (mul *= 0x100)) {
			val += this[offset + --byteLength] * mul;
		}

		return val;
	};

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 1, this.length);
		return this[offset];
	};

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 2, this.length);
		return this[offset] | (this[offset + 1] << 8);
	};

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 2, this.length);
		return (this[offset] << 8) | this[offset + 1];
	};

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 4, this.length);

		return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000);
	};

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 4, this.length);

		return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3]);
	};

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
		offset = offset >>> 0;
		byteLength = byteLength >>> 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);

		let val = this[offset];
		let mul = 1;
		let i = 0;
		while (++i < byteLength && (mul *= 0x100)) {
			val += this[offset + i] * mul;
		}
		mul *= 0x80;

		if (val >= mul) val -= Math.pow(2, 8 * byteLength);

		return val;
	};

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
		offset = offset >>> 0;
		byteLength = byteLength >>> 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);

		let i = byteLength;
		let mul = 1;
		let val = this[offset + --i];
		while (i > 0 && (mul *= 0x100)) {
			val += this[offset + --i] * mul;
		}
		mul *= 0x80;

		if (val >= mul) val -= Math.pow(2, 8 * byteLength);

		return val;
	};

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 1, this.length);
		if (!(this[offset] & 0x80)) return (this[offset]);
		return ((0xff - this[offset] + 1) * -1);
	};

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 2, this.length);
		const val = this[offset] | (this[offset + 1] << 8);
		return (val & 0x8000) ? val | 0xFFFF0000 : val;
	};

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 2, this.length);
		const val = this[offset + 1] | (this[offset] << 8);
		return (val & 0x8000) ? val | 0xFFFF0000 : val;
	};

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 4, this.length);

		return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24);
	};

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 4, this.length);

		return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3]);
	};

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 4, this.length);
		return ieee754.read(this, offset, true, 23, 4);
	};

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 4, this.length);
		return ieee754.read(this, offset, false, 23, 4);
	};

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 8, this.length);
		return ieee754.read(this, offset, true, 52, 8);
	};

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
		offset = offset >>> 0;
		if (!noAssert) checkOffset(offset, 8, this.length);
		return ieee754.read(this, offset, false, 52, 8);
	};

	function checkInt (buf, value, offset, ext, max, min) {
		if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
		if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
		if (offset + ext > buf.length) throw new RangeError('Index out of range');
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset >>> 0;
		byteLength = byteLength >>> 0;
		if (!noAssert) {
			const maxBytes = Math.pow(2, 8 * byteLength) - 1;
			checkInt(this, value, offset, byteLength, maxBytes, 0);
		}

		let mul = 1;
		let i = 0;
		this[offset] = value & 0xFF;
		while (++i < byteLength && (mul *= 0x100)) {
			this[offset + i] = (value / mul) & 0xFF;
		}

		return offset + byteLength;
	};

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset >>> 0;
		byteLength = byteLength >>> 0;
		if (!noAssert) {
			const maxBytes = Math.pow(2, 8 * byteLength) - 1;
			checkInt(this, value, offset, byteLength, maxBytes, 0);
		}

		let i = byteLength - 1;
		let mul = 1;
		this[offset + i] = value & 0xFF;
		while (--i >= 0 && (mul *= 0x100)) {
			this[offset + i] = (value / mul) & 0xFF;
		}

		return offset + byteLength;
	};

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
		this[offset] = (value & 0xff);
		return offset + 1;
	};

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
		this[offset] = (value & 0xff);
		this[offset + 1] = (value >>> 8);
		return offset + 2;
	};

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
		this[offset] = (value >>> 8);
		this[offset + 1] = (value & 0xff);
		return offset + 2;
	};

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
		this[offset + 3] = (value >>> 24);
		this[offset + 2] = (value >>> 16);
		this[offset + 1] = (value >>> 8);
		this[offset] = (value & 0xff);
		return offset + 4;
	};

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
		this[offset] = (value >>> 24);
		this[offset + 1] = (value >>> 16);
		this[offset + 2] = (value >>> 8);
		this[offset + 3] = (value & 0xff);
		return offset + 4;
	};

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) {
			const limit = Math.pow(2, (8 * byteLength) - 1);

			checkInt(this, value, offset, byteLength, limit - 1, -limit);
		}

		let i = 0;
		let mul = 1;
		let sub = 0;
		this[offset] = value & 0xFF;
		while (++i < byteLength && (mul *= 0x100)) {
			if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
				sub = 1;
			}
			this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
		}

		return offset + byteLength;
	};

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) {
			const limit = Math.pow(2, (8 * byteLength) - 1);

			checkInt(this, value, offset, byteLength, limit - 1, -limit);
		}

		let i = byteLength - 1;
		let mul = 1;
		let sub = 0;
		this[offset + i] = value & 0xFF;
		while (--i >= 0 && (mul *= 0x100)) {
			if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
				sub = 1;
			}
			this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
		}

		return offset + byteLength;
	};

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
		if (value < 0) value = 0xff + value + 1;
		this[offset] = (value & 0xff);
		return offset + 1;
	};

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
		this[offset] = (value & 0xff);
		this[offset + 1] = (value >>> 8);
		return offset + 2;
	};

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
		this[offset] = (value >>> 8);
		this[offset + 1] = (value & 0xff);
		return offset + 2;
	};

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
		this[offset] = (value & 0xff);
		this[offset + 1] = (value >>> 8);
		this[offset + 2] = (value >>> 16);
		this[offset + 3] = (value >>> 24);
		return offset + 4;
	};

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
		if (value < 0) value = 0xffffffff + value + 1;
		this[offset] = (value >>> 24);
		this[offset + 1] = (value >>> 16);
		this[offset + 2] = (value >>> 8);
		this[offset + 3] = (value & 0xff);
		return offset + 4;
	};

	function checkIEEE754 (buf, value, offset, ext, max, min) {
		if (offset + ext > buf.length) throw new RangeError('Index out of range');
		if (offset < 0) throw new RangeError('Index out of range');
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) {
			checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
		}
		ieee754.write(buf, value, offset, littleEndian, 23, 4);
		return offset + 4;
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
		return writeFloat(this, value, offset, true, noAssert);
	};

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
		return writeFloat(this, value, offset, false, noAssert);
	};

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
		value = +value;
		offset = offset >>> 0;
		if (!noAssert) {
			checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
		}
		ieee754.write(buf, value, offset, littleEndian, 52, 8);
		return offset + 8;
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
		return writeDouble(this, value, offset, true, noAssert);
	};

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
		return writeDouble(this, value, offset, false, noAssert);
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
		if (!start) start = 0;
		if (!end && end !== 0) end = this.length;
		if (targetStart >= target.length) targetStart = target.length;
		if (!targetStart) targetStart = 0;
		if (end > 0 && end < start) end = start;

		// Copy 0 bytes; we're done
		if (end === start) return 0;
		if (target.length === 0 || this.length === 0) return 0;

		// Fatal error conditions
		if (targetStart < 0) {
			throw new RangeError('targetStart out of bounds');
		}
		if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
		if (end < 0) throw new RangeError('sourceEnd out of bounds');

		// Are we oob?
		if (end > this.length) end = this.length;
		if (target.length - targetStart < end - start) {
			end = target.length - targetStart + start;
		}

		const len = end - start;
		let i;

		if (this === target && start < targetStart && targetStart < end) {
			// descending copy from end
			for (i = len - 1; i >= 0; --i) {
				target[i + targetStart] = this[i + start];
			}
		} else if (len < 1000) {
			// ascending copy from start
			for (i = 0; i < len; ++i) {
				target[i + targetStart] = this[i + start];
			}
		} else {
			Uint8Array.prototype.set.call(
				target,
				this.subarray(start, start + len),
				targetStart
			);
		}

		return len;
	};

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
		// Handle string cases:
		if (typeof val === 'string') {
			if (typeof start === 'string') {
				encoding = start;
				start = 0;
				end = this.length;
			} else if (typeof end === 'string') {
				encoding = end;
				end = this.length;
			}
			if (val.length === 1) {
				const code = val.charCodeAt(0);
				if (code < 256) {
					val = code;
				}
			}
			if (encoding !== undefined && typeof encoding !== 'string') {
				throw new TypeError('encoding must be a string');
			}
			if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
				throw new TypeError('Unknown encoding: ' + encoding);
			}
		} else if (typeof val === 'number') {
			val = val & 255;
		}

		// Invalid ranges are not set to a default, so can range check early.
		if (start < 0 || this.length < start || this.length < end) {
			throw new RangeError('Out of range index');
		}

		if (end <= start) {
			return this;
		}

		start = start >>> 0;
		end = end === undefined ? this.length : end >>> 0;

		if (!val) val = 0;

		let i;
		if (typeof val === 'number') {
			for (i = start; i < end; ++i) {
				this[i] = val;
			}
		} else {
			const bytes = Buffer.isBuffer(val)
				? val
				: new Buffer(val, encoding);
			const len = bytes.length;
			for (i = 0; i < end - start; ++i) {
				this[i + start] = bytes[i % len];
			}
		}

		return this;
	};

	// HELPER FUNCTIONS
	// ================

	const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

	function base64clean (str) {
		// Node strips out invalid characters like \n and \t from the string, base64-js does not
		str = str.trim().replace(INVALID_BASE64_RE, '');
		// Node converts strings with length < 2 to ''
		if (str.length < 2) return '';
		// Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
		while (str.length % 4 !== 0) {
			str = str + '=';
		}
		return str;
	}

	function toHex (n) {
		if (n < 16) return '0' + n.toString(16);
		return n.toString(16);
	}

	function utf8ToBytes (string, units) {
		units = units || Infinity;
		let codePoint;
		const length = string.length;
		let leadSurrogate = null;
		const bytes = [];

		for (let i = 0; i < length; ++i) {
			codePoint = string.charCodeAt(i);

			// is surrogate component
			if (codePoint > 0xD7FF && codePoint < 0xE000) {
				// last char was a lead
				if (!leadSurrogate) {
					// no lead yet
					if (codePoint > 0xDBFF) {
						// unexpected trail
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
						continue;
					} else if (i + 1 === length) {
						// unpaired lead
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
						continue;
					}

					// valid lead
					leadSurrogate = codePoint;

					continue;
				}

				// 2 leads in a row
				if (codePoint < 0xDC00) {
					if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
					leadSurrogate = codePoint;
					continue;
				}

				// valid surrogate pair
				codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
			} else if (leadSurrogate) {
				// valid bmp char, but last char was a lead
				if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
			}

			leadSurrogate = null;

			// encode utf8
			if (codePoint < 0x80) {
				if ((units -= 1) < 0) break;
				bytes.push(codePoint);
			} else if (codePoint < 0x800) {
				if ((units -= 2) < 0) break;
				bytes.push(
					codePoint >> 0x6 | 0xC0,
					codePoint & 0x3F | 0x80
				);
			} else if (codePoint < 0x10000) {
				if ((units -= 3) < 0) break;
				bytes.push(
					codePoint >> 0xC | 0xE0,
					codePoint >> 0x6 & 0x3F | 0x80,
					codePoint & 0x3F | 0x80
				);
			} else if (codePoint < 0x110000) {
				if ((units -= 4) < 0) break;
				bytes.push(
					codePoint >> 0x12 | 0xF0,
					codePoint >> 0xC & 0x3F | 0x80,
					codePoint >> 0x6 & 0x3F | 0x80,
					codePoint & 0x3F | 0x80
				);
			} else {
				throw new Error('Invalid code point');
			}
		}

		return bytes;
	}

	function asciiToBytes (str) {
		const byteArray = [];
		for (let i = 0; i < str.length; ++i) {
			// Node's code seems to be doing this and not & 0x7F..
			byteArray.push(str.charCodeAt(i) & 0xFF);
		}
		return byteArray;
	}

	function utf16leToBytes (str, units) {
		let c, hi, lo;
		const byteArray = [];
		for (let i = 0; i < str.length; ++i) {
			if ((units -= 2) < 0) break;

			c = str.charCodeAt(i);
			hi = c >> 8;
			lo = c % 256;
			byteArray.push(lo);
			byteArray.push(hi);
		}

		return byteArray;
	}

	function base64ToBytes (str) {
		return base64.toByteArray(base64clean(str));
	}

	function blitBuffer (src, dst, offset, length) {
		for (var i = 0; i < length; ++i) {
			if ((i + offset >= dst.length) || (i >= src.length)) break;
			dst[i + offset] = src[i];
		}
		return i;
	}

	// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
	function isArrayBufferView (obj) {
		return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj);
	}

	function numberIsNaN (obj) {
		return obj !== obj; // eslint-disable-line no-self-compare
	}

},{'base64-js':12,'ieee754':14}],14:[function(require,module,exports){
	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
		let e, m;
		const eLen = nBytes * 8 - mLen - 1;
		const eMax = (1 << eLen) - 1;
		const eBias = eMax >> 1;
		let nBits = -7;
		let i = isLE ? (nBytes - 1) : 0;
		const d = isLE ? -1 : 1;
		let s = buffer[offset + i];

		i += d;

		e = s & ((1 << (-nBits)) - 1);
		s >>= (-nBits);
		nBits += eLen;
		for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

		m = e & ((1 << (-nBits)) - 1);
		e >>= (-nBits);
		nBits += mLen;
		for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

		if (e === 0) {
			e = 1 - eBias;
		} else if (e === eMax) {
			return m ? NaN : ((s ? -1 : 1) * Infinity);
		} else {
			m = m + Math.pow(2, mLen);
			e = e - eBias;
		}
		return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
		let e, m, c;
		let eLen = nBytes * 8 - mLen - 1;
		const eMax = (1 << eLen) - 1;
		const eBias = eMax >> 1;
		const rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
		let i = isLE ? 0 : (nBytes - 1);
		const d = isLE ? 1 : -1;
		const s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

		value = Math.abs(value);

		if (isNaN(value) || value === Infinity) {
			m = isNaN(value) ? 1 : 0;
			e = eMax;
		} else {
			e = Math.floor(Math.log(value) / Math.LN2);
			if (value * (c = Math.pow(2, -e)) < 1) {
				e--;
				c *= 2;
			}
			if (e + eBias >= 1) {
				value += rt / c;
			} else {
				value += rt * Math.pow(2, 1 - eBias);
			}
			if (value * c >= 2) {
				e++;
				c /= 2;
			}

			if (e + eBias >= eMax) {
				m = 0;
				e = eMax;
			} else if (e + eBias >= 1) {
				m = (value * c - 1) * Math.pow(2, mLen);
				e = e + eBias;
			} else {
				m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
				e = 0;
			}
		}

		for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

		e = (e << mLen) | m;
		eLen += mLen;
		for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

		buffer[offset + i - d] |= s * 128;
	};

},{}]},{},[1]);
