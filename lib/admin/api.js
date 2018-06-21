const Mitter = require('../mitter');

module.exports = class Api extends Mitter {
	constructor(ns) {
		super(ns);
		this.on('load.section', (path) => {
			this.load(path, (err, response) =>  {
				if(err) {
					this.emit('load.section.fail', err);
				} else {
					this.emit('load.section.success', {path: path, data: response});
				}
			});
		});

		this.on('save.section', (object) => {
			this.save(object.path, object.data, (err) => {
				if(err) {
					console.err(err);
					this.emit('save.section.fail');
				} else {
					console.log('Done!');
					this.emit('save.section.success');
				}
			});
		});
	}

	load(path, callback) {
		try {
			const req = new XMLHttpRequest();
			req.open('GET', path);
			req.setRequestHeader('Accept', 'text/markdown');
			//req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			req.onreadystatechange = function() {
				if (req.readyState === XMLHttpRequest.DONE) {
					if (req.status === 200) {
						callback(null, req.response);
					} else {
						callback('Failed: ' + req.status);
					}
				}
			}.bind(this);
			req.send();
		} catch (e) {
			callback(e);
		}
	}

	save(path, value, callback) {
		try {
			const req = new XMLHttpRequest();
			req.open('POST', path);
			req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			req.onreadystatechange = function() {
				if (req.readyState === XMLHttpRequest.DONE) {
					if (req.status === 200) {
						callback();
						//						console.log('Done');
					} else {
						callback('Failed: ' + req.status);
						//this.emit('api.query.loaded.failed', req.status);
					}
				}
			}.bind(this);
			req.send(JSON.stringify({
				body: value
			}));
		} catch (e) {
			//this.emit('api.query.loaded.failed', e);
			callback(e);
		}
	}
};
