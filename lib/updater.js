const Mitter = require('./mitter');
const CookieTalk = require('cookie-talk').factory();

module.exports = class Updater extends Mitter {

	constructor(sections) {
		super();
		this.sections = sections;
		this.command = new CookieTalk('push-text');
		this.command.onMessage((data) => {
			var object = JSON.parse(data);
			if(this.sections[object.path]) {
				this.sections[object.path].update(object.data);
			} else {
				this.emit('error', new Error('Invalid section push'))
				console.error('Invalid section push' + object.path);
				console.log(this.sections);
			}
		})
	}
}
