const cookieTalk = require('cookie-talk').factory();
const Receptor = require('../lib/admin/receptor');
const Api = require('../lib/admin/api');
const Editor = require('../lib/admin/editor');
const Save = require('../lib/admin/save');

const ns = 'admin';

const receptor = new Receptor(ns);
const api = new Api(ns);
const editor = new Editor(document.getElementById('input'));

const save = new Save(document.getElementById('save'));
