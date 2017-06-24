const Mitter = require('../mitter');

module.exports = class Save extends Mitter {

	constructor(e) {
		super()
		this.path = null;
		this.e = e;
		this.e.addEventListener('click', (e) => {
			this.emit('save.initiated', function() {
				console.log('Save initiated');
			})
		})

		this.on('save.section', () => {
			this.e.disabled = true;
		})

		this.on('save.section.success', () => {
			this.e.disabled = false;
		})

		this.on('save.section.fail', () => {
			this.e.disabled = false;
		})
	}
}
