const Router = require('express').Router();
const labelGeneration = require('./labels-generation.model');

Router.post('/gen-pdf-a4', labelGeneration.generatePDFA4);
Router.post('/trigger-label', labelGeneration.triggerPDFGeneration);

module.exports = Router;