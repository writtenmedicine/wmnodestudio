const express = require('express');
const expressLayout = require("express-ejs-layouts");
const bodyParser = require('body-parser');
//const auth = require('./src/user-actions/auth.route');
const labelRoute = require('./src/labels/labels-generation.route');
const wmAPIRoute = require('./src/api/wmapi.route');

const dotenv = require('dotenv').config()
require('dotenv/config');

const wmServices = express();

wmServices.use(bodyParser.json({limit: '10mb'}));
wmServices.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
wmServices.use(bodyParser.json());

//Static Files
wmServices.use(express.static('public'));

//Templating Engine
wmServices.use(expressLayout);
wmServices.set('layout', './layouts/main');
wmServices.set('view engine', 'ejs');

wmServices.get('/', (req, res) => {
    const locals = {
        title: 'Written Medicine | Home'
    }
    res.render('index', {locals});
})

wmServices.get('/api/health', (req, res) => {res.sendStatus(200);});

wmServices.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Final-Length, Offset, Content-Range, Content-Disposition,cid,jwt,user_id, selected_role_id');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

//wmServices.use('/bmapi/auth', auth); //Auth
wmServices.use('/wm/label-generation', labelRoute);
wmServices.use('/wm/rest-api', wmAPIRoute);

const wmStudioPort = process.env.PORT || 5000

wmServices.listen(wmStudioPort, () => {console.log('Listening at port: ' + wmStudioPort);document.write(`Welcome to Written Medicine REST API.`)});
