const mitter = require('./mitter');
const marked = require('../node_modules/marked/index.js');

module.exports = class Section extends mitter {

	constructor(element) {
		super();
		this.element = element;
		this.path = window.location.pathname;
		if(this.element.hasAttribute('data-path')) {
			this.path = this.element.getAttribute('data-path');
		}
		this.element.addEventListener('click', function(e) {
			this.emit('load.section', this.path);
			// if (e.shiftKey) {
			// 	this.emit('load.section', this.path);
			// }
		}.bind(this));
	}

	getPath() {
		return this.path;
	}

	update(data) {
		this.element.innerHTML = marked(data);
	}
};
