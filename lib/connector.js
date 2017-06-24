const mitter = require('./mitter');
const cookieTalk = require('cookie-talk').factory();


module.exports = class extends mitter {

	constructor() {
		super();
		this.push = new cookieTalk('push-channel');
		this.on('load.section', function(path) {
			this.push.send();
		});
	}

}
