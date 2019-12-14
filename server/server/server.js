require('dotenv').config();
// console.log(process.env)
var {mongoose} = require('./db/mongoose');

const express 	 = require('express');
const bodyParser = require('body-parser');
// const {ObjectID} = require('mongodb');
var path 		 = require('path');
var compression  = require('compression');
var app 		 = express();

const mustacheExpress = require('mustache-express');

app.engine('html', mustacheExpress());

app.set('view engine', 'html');
app.set('views',path.join(__dirname, 'views'));

app.use(compression())
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
    next();
});

const api 	=	 require('./routes/api');

app.use('/static', express.static(path.join(__dirname, 'public')));

app.use('/api',api);

// catch 404 and forward to error handler
/*app.use(function (req, res, next) {
});*/

module.exports = app;
