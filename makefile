bundle:
	node_modules/.bin/browserify ./front-src/admin.js > public/admin.js && echo 'Admin Bundled'
	node_modules/.bin/browserify ./front-src/index.js > public/index.js && echo 'Main Bundled'
minify:
	node_modules/.bin/uglifyjs public/admin.js -o public/admin.min.js -m -c && echo 'Admin Minified'
	node_modules/.bin/uglifyjs public/index.js -o public/index.min.js -m -c && echo 'Main Minified'
