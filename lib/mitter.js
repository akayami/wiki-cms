const mitt = require('mitt');
module.exports = class mitter {
	constructor(channel = 'default') {
		this.h = mitt();
		this.channel = channel;
	}

	emit(type, val) {
		this.h.emit(type, val)
	}

	on(type, handler) {
		this.h.on(type, handler)
	}

	off(type, handler) {
		this.h.off(type, handler);
	}
}
