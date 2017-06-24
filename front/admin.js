const cookieTalk = require('cookie-talk').factory();

const cookieName = 'textinput';
const sendText = 'sendText';

var text = new cookieTalk(sendText)
text.onMessage(function(msg) {
	//console.log('msg', msg);
	document.getElementById('input').value = msg;
})

var c = new cookieTalk(cookieName);
//var e = document.getElementById('save');
// e.addEventListener('click', (e) => {
// 	c.send('hello', function(message) {
// 		console.log('Gone: ' + message);
// 	});
// });

var input = document.getElementById('input');
input.addEventListener('keyup', (e) => {
	c.send(input.value, function() {
		//console.log('sent!');
	})
})
//
var control = new cookieTalk('control-channel');
document.getElementById('save').addEventListener('click', function(e) {
	console.log('Saving');
	control.send('save', function() {

	})
});
