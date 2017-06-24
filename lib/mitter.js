module.exports = class Mitter {
	
	constructor() {
		this.globalNS = '__customEventRegsiter';
	}

	emit(namespace, payload, sync = false) {
		if (window[this.globalNS] && window[this.globalNS][namespace]) {
			for (var x = 0; x < window[this.globalNS][namespace].length; x++) {
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
			window[this.globalNS] = {}
		}
		if (!window[this.globalNS][namespace]) {
			window[this.globalNS][namespace] = [];
		}
		window[this.globalNS][namespace].push(func);
	}
}

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
