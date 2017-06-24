const Mitter = require('../mitter');
const CookieTalk = require('cookie-talk').factory();

module.exports = class Editor extends Mitter {

	constructor(e) {
		super()
		this.path = null;
		this.e = e;
		this.command = new CookieTalk('push-text');
		this.on('load.section.success', (payload) => {
			this.path = payload.path
			this.e.value = payload.data
		})

		this.on('save.initiated', () => {
			this.emit('save.section', {
				path: this.path,
				data: this.e.value
			})
		})

		this.e.addEventListener('keyup', (e) => {
			this.command.send(JSON.stringify({
				path: this.path,
				data: this.e.value
			}), function() {
				console.log('Data pushed');
			})
		})
	}

}
