const Router = require('express').Router();
const labelGeneration = require('./labels-generation.model');
const wmAPIModel = require('../api/wmapi.model');

Router.post('/gen-pdf-a4', labelGeneration.generatePDFA4);
Router.post('/trigger-label', labelGeneration.triggerPDFGeneration);
Router.post('/label-information', wmAPIModel.validateAPIToken, labelGeneration.getLabelInformation);

module.exports = Router;