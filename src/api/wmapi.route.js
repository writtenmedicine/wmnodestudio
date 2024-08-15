const Router = require('express').Router();
const wmAPIModel = require('./wmapi.model');

Router.post('/add-account', wmAPIModel.checkPharmacy, wmAPIModel.addPharmacy);
Router.post('/generate-token', wmAPIModel.generateAPIToken);
Router.post('/search-directions', wmAPIModel.validateAPIToken, wmAPIModel.getDirections);

module.exports = Router;