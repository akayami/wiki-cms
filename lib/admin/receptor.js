const Mitter = require('../mitter');
const CookieTalk = require('cookie-talk').factory();

module.exports = class Receptor extends Mitter {

	constructor(ns) {
		super(ns)
		this.command = new CookieTalk('command-up');
		this.command.onMessage(function(message) {
			this.emit('load.section', message)
		}.bind(this))
	}
}
