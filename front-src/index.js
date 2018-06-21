const cookieTalk = require('cookie-talk').factory();

const editor = document.getElementById('source');
const Section = require('../lib/section');
const Connector = require('../lib/connector');
const Updater = require('../lib/updater');
const Mitter = require('../lib/mitter');

const connector = new Connector();

const editables = document.getElementsByClassName('container-editable');

const sections = {};

for(let x = 0; x < editables.length; x++) {
	const s = new Section(editables[x]);
	sections[s.getPath()] = s;
}

const updater = new Updater(sections);


const mitter = new Mitter();

mitter.emit('load.section', window.location.pathname);
