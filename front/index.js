const cookieTalk = require('cookie-talk').factory();


const marked = require('../node_modules/marked/index.js')
const cookieName = 'textinput';
const d = 'sendText';
const editor = document.getElementById('source');
const Section = require('../lib/section');


var c = new cookieTalk(cookieName);
c.onMessage(function(message) {
	//console.log('Got Message' + message);
	editor.value = message;
	document.getElementById('body').innerHTML = marked(message);
})


var text = new cookieTalk(d)
var data = document.getElementById('source').value;

text.send(data, function() {
	console.log('Pushed Initial Source');
});

var control = new cookieTalk('control-channel');
control.onMessage(function(message) {
	switch(message) {
		case 'save':
			try {
				var req = new XMLHttpRequest();
				req.open('POST', window.location.href);
				req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
				req.onreadystatechange = function() {
					if (req.readyState === XMLHttpRequest.DONE) {
						if (req.status === 200) {
							console.log('Done');
						} else {
							console.error('Failed: ' + req.status);
							//this.emit('api.query.loaded.failed', req.status);
						}
					}
				}.bind(this);
				req.send(JSON.stringify({
					body: editor.value,
					hash: hash
				}));
			} catch (e) {
				//this.emit('api.query.loaded.failed', e);
				console.error(e);
			}
			break;
		default:
			console.log('Failed: ' + message);
	}
})

var editables = document.getElementsByClassName('container-editable');

var sections = [];

for(var x = 0; x < editables.length; x++) {
	sections.push(new Section(editables[x]));
}

console.log(editables);
