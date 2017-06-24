const mitter = require('./mitter');

module.exports = class extends mitter {

	constructor(element) {
		super();
		this.element = element;
		this.element.addEventListener('click', function(e) {
			if (e.shiftKey) {
				var path = window.location.pathname;
				if(this.element.hasAttribute('data-path')) {
					var path = this.element.getAttribute('data-path');
				}
				this.emit('load.section', path);
			}
		}.bind(this))
	}
}
