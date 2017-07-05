const toml = require('toml');
const concat = require('concat-stream');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
var cfgfile = path.resolve(__dirname, process.argv[2]);
if (!process.argv[2]) {
	console.error('Need a config file');
	process.exit(1)
}

fs.createReadStream(cfgfile, 'utf8').pipe(concat(function(data) {
	const config = toml.parse(data);
	const express = require('express');
	const app = express();
	const marked = require('marked');
	marked.setOptions({
		renderer: new marked.Renderer(),
		gfm: true,
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: false,
		smartLists: true,
		smartypants: false
	})
	const {
		URL
	} = require('url');
	const HttpForbidden = require('./lib/error/http/forbidden');
	const HttpError = require('./lib/error/http.js');
	const path = require('path');
	const bodyParser = require('body-parser');
	const crypto = require('crypto');


	const fsRoot = config.git.repo;
	const prefix = config.git.data_prefix;

	const secret = 'adfasdasdaser34';

	const git = require('simple-git')(fsRoot);

	var dirty = false;

	app.set('view engine', 'ejs');

	app.use('/static', express.static(path.join(__dirname, 'public')));

	app.use(function(req, res, next) {
		if (req.headers['x-user-info-proxy']) {
			req.user = JSON.parse(req.headers['x-user-info-proxy']);
			console.log(req.user.profile.emails);
			console.log(req.user.profile.displayName);
		}
		next();
	})

	app.get(config.admin.pathname, function(req, res, next) {
		if (req.user) {
			res.render('admin');
		} else {
			res.sendStatus(403);
		}
	})

	app.use(function(req, res, next) {
		res.locals.partials = {};

		var file = req.url.replace(prefix + '/', '');
		if (file.match(/_/)) {
			res.locals.partial = true;
		}
		req.file = path.resolve(fsRoot, file + '.md');
		next();
	})

	if (config.app.partials && config.app.partials.length) {
		config.app.partials.forEach((partial) => {
			app.use(function(req, res, next) {
				if (!res.locals.partial) {
					var p = path.resolve(fsRoot, this.partial + '.md');
					fs.readFile(p, (err, data) => {
						if (!err) {
							res.locals.partials[this.partial] = marked(data.toString());
						}
						next()
					})
				} else {
					next()
				}
			}.bind({
				partial: partial
			}));
		})
	}

	app.use(bodyParser.json(), function(req, res, next) {
		if (['POST'].includes(req.method)) {
			if (req.user) {
				fs.mkdirp(path.dirname(req.file), (err) => {
					fs.writeFile(req.file, req.body.body, function(err, output) {
						if (err) {
							console.error(err);
							res.sendStatus(500)
						} else {
							dirty = true;
							res.sendStatus(200);
							git.add(req.file, function(err) {
								if (err) {
									console.error(err);
								} else {
									console.log(req.file + ' Added');
									git.commit('Autocommit for ' + req.user.profile.displayName, function(err) {
										console.error(err);
									})
								}
							})
						}
					})
				})
			} else {
				res.sendStatus(403);
			}
		} else {
			next();
		}
	});

	app.use(function(req, res, next) {
		if (['HEAD', 'GET'].includes(req.method)) {
			var current = new URL(req.url, req.protocol + '://' + req.headers.host);
			fs.readFile(req.file, (err, data) => {
				if (req.accepts('html')) {
					if (err) {
						res.render('index', {
							body: '',
							source: '',
							hash: crypto.createHash('md5').update(secret + req.url).digest('hex'),
							authenticated: (req.user ? true : false)
						})
					} else {
						res.render('index', {
							body: marked(data.toString()),
							source: data.toString(),
							hash: crypto.createHash('md5').update(secret + req.url).digest('hex'),
							authenticated: (req.user ? true : false)
						})
					}
				} else if (req.accepts('text/markdown')) {
					res.send(data).end();
				}
			})
		} else {
			next();
		}
	});

	/**
	 * Uncontained total failure handler. Only enters if next(err) was pushed
	 */
	app.use(function(err, req, res, next) {
		if (err instanceof HttpError) {
			req.session.destroy();
			console.error(err);
			res.status(err.getStatus());
			res.end();
		} else {
			console.error(err);
			res.status(500);
			res.end();
		}
	});

	app.use(function(req, res, next) {
		res.sendStatus(404);
	});

	var server = http.createServer(app);

	// Based on
	// https://stackoverflow.com/questions/16178239/gracefully-shutdown-unix-socket-server-on-nodejs-running-under-forever

	server.on('error', function(e) {
		if (e.code == 'EADDRINUSE') {
			var s = new http.createServer(app);
			s.on('error', function(e) { // handle error trying to talk to server
				if (e.code == 'ECONNREFUSED') { // No other server listening
					fs.unlinkSync(config.app.port);
					http.listen(config.app.port, function() { //'listening' listener
						console.log('server recovered');
					});
				}
			});
			s.listen({
				path: config.app.port
			}, function() {
				console.log('Server running, giving up...');
				process.exit();
			});
		}
	});

	server.listen(config.app.port);
}))
