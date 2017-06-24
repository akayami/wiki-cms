const Mitter = require('./mitter');
const CookieTalk = require('cookie-talk').factory();

module.exports = class Connector extends Mitter {

	constructor() {
		super();
		this.command = new CookieTalk('command-up');
		this.on('load.section', function(path) {
			this.command.send(path);
		}.bind(this));
	}

}
