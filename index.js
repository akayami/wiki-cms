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
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const crypto = require('crypto');


const fsRoot = '/home/tomasz/dev/jingo-site/';
const prefix = '';

const secret = 'adfasdasdaser34';

const git = require('simple-git')(fsRoot);

var dirty = false;

git.pull('origin', 'master', function() {
	console.log('Pull Done');
})

setInterval(function() {
	git.pull('origin', 'master', function(err) {
		if (err) {
			console.log(err);
		}
		console.log('Auto Pull Done');
	})
}, 60000);


setInterval(function() {
	if (dirty) {
		git.push('origin', 'master', function(err) {
			if (err) {
				console.log(err);
			}
			console.log('Auto Push Done');
		})
		dirty = false
	}
}, 1000)

app.set('view engine', 'ejs');

app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/admin', function(req, res, next) {
	res.render('admin');
})

app.use(function(req, res, next) {

	res.locals.sidebar = false;
	res.locals.footer = false;
	res.locals.header = false;

	//	var current = new URL(req.url, req.protocol + '://' + req.headers.host);
	console.log(req.url);
	var file = req.url.replace(prefix + '/', '');
	if (file.match(/_/)) {
		res.locals.partial = true;
	}
	console.log(fsRoot);
	req.file = path.resolve(fsRoot, file + '.md');
	console.log(req.file);
	next();
})

app.use(function(req, res, next) {
	if (!res.locals.partial) {
		var p = path.resolve(fsRoot, '_sidebar' + '.md');
		fs.readFile(p, (err, data) => {
			if (!err) {
				res.locals.sidebar = marked(data.toString());
			}
			next()
		})
	} else {
		next()
	}
});

app.use(function(req, res, next) {
	if (!res.locals.partial) {
		var p = path.resolve(fsRoot, '_footer' + '.md');
		fs.readFile(p, (err, data) => {
			if (!err) {
				res.locals.footer = marked(data.toString());
			}
			next()
		})
	} else {
		next()
	}
});


app.use(function(req, res, next) {
	if (!res.locals.partial) {
		var p = path.resolve(fsRoot, '_header' + '.md');
		fs.readFile(p, (err, data) => {
			if (!err) {
				res.locals.header = marked(data.toString());
			}
			next()
		})
	} else {
		next()
	}
});

app.use(bodyParser.json(), function(req, res, next) {
	if (['POST'].includes(req.method)) {
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
							git.commit('Autocommit', function(err) {
								console.error(err);
							})
						}
					})
				}
			})
		})
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
						authenticated: true
					})
				} else {
					res.render('index', {
						body: marked(data.toString()),
						source: data.toString(),
						hash: crypto.createHash('md5').update(secret + req.url).digest('hex'),
						authenticated: true
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

app.listen(5555);
