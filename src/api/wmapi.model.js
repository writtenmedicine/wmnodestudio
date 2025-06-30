const pool = require('../config/db.config');
const wmCommon = require('../common/common.model');
const bcrypt = require('bcryptjs')
const eventLogger = require('../services/auditlog.service');
const encrypt_decrypt = require('../services/decrypt.js');

String.prototype.replaceAllTxt = function replaceAll(search, replace) { return this.split(search).join(replace); }

const getDirections = async (req, res) => {
    try {
        var lang = (req.body.language).toLowerCase();
        var dirColumn = lang+'_dir';
        const [getDirs, gdf] = await pool.pool1.execute(`SELECT eng_dir AS 'english', ${dirColumn} AS 'translation' FROM wm_directions WHERE attr LIKE '%${req.body.searchString}%' OR ldh_attr LIKE '%${req.body.searchString}%' OR eng_dir LIKE '%${req.body.searchString}%' ORDER BY CHAR_LENGTH(eng_dir) ASC LIMIT 10`);
        var returnArray = [];
        await wmCommon.asyncForEach(getDirs, async (ele, i) => {
            returnArray.push(ele);
        });        
        res.status(200).send({error: false, message: returnArray});
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, message: "Error Processing Request"});
    }
}

const validateAPIToken = async (req, res, next) => {
    try {
        const [getToken, gtf] = await pool.pool2.execute(`SELECT * FROM wm_pharmacy_token WHERE wmPharmKey=? AND wmPharmToken=? AND isActive=? AND tokenExpiryDate >= NOW()`, [req.body.key, req.body.token, '1']);

        if(getToken.length > 0){
            next();
        } else{
            res.status(400).send({error: true, message: "Token Expired! Please Regenerate!"});
        }
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, message: "Invalid Token!!"});
    }
}

const generateAPIToken = async (req, res) => {
    try {
        const [getPharm, gpf] = await pool.pool2.execute(`SELECT wp.wmPharmId, wp.wmPharmName, wpt.wmPharmKey FROM wm_pharmacy wp JOIN wm_pharmacy_token wpt ON wp.wmPharmId=wpt.wmPharmId WHERE wp.wmPharmEmail=?`, [req.body.email]);
        if(getPharm.lenght > 0){
            const salt = await bcrypt.genSalt(10);
            const pharmToken = await bcrypt.hash(getPharm[0].wmPharmName+req.body.email, salt);

            var date = new Date();
            date.setDate(date.getDate() + 30);
            const updatedDate = date.toISOString().replace("T", " ");
            const tokenExpiryDate = updatedDate.substring(0, updatedDate.length - 5);

            const [adToken, atf] = await pool.pool2.execute(`UPDATE wm_pharmacy_token SET wmPharmToken=?, tokenExpiryDate=? WHERE wmPharmId=?`, [pharmToken, tokenExpiryDate, getPharm[0].wmPharmId]);
            res.status(200).send({error: false, message: {key: getPharm[0].wmPharmKey, token: pharmToken}});
        }
        else{
            res.status(400).send({error: true, message: "Account not registered!"});
        }
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, message: "Error Processing Request"});
    }
}

const checkPharmacy = async (req, res, next) => {
    try {
        const [getAcc, gaf] = await pool.pool2.execute(`SELECT * FROM wm_pharmacy WHERE wmPharmEmail=?`, [req.body.email]);
        if(getAcc.lenght > 0){
            res.status(200).send({error: false, message: 'Account already registered'});
        }
        else{
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, message: "Error Processing Request"});
    }
}

const addPharmacy = async (req, res) => {
    try {
        const [addAcc, aaf] = await pool.pool2.execute(`INSERT INTO wm_pharmacy (wmPharmEmail, wmPharmName) VALUES (?, ?)`, [req.body.email, req.body.pharmacyName]);

        const pharmKey = wmCommon.create_UUID(addAcc.insertId);

        const salt = await bcrypt.genSalt(10);
        const pharmToken = await bcrypt.hash(req.body.pharmacyName+req.body.email, salt);

        var date = new Date();
        date.setDate(date.getDate() + 30);
        const updatedDate = date.toISOString().replace("T", " ");
        const tokenExpiryDate = updatedDate.substring(0, updatedDate.length - 5);

        const [adToken, atf] = await pool.pool2.execute(`INSERT INTO wm_pharmacy_token(wmPharmId, wmPharmKey, wmPharmToken, tokenExpiryDate) VALUES (?, ?, ?, ?)`, [addAcc.insertId, pharmKey, pharmToken, tokenExpiryDate]);
        
        res.status(200).send({error: false, message: {key: pharmKey, token: pharmToken}});
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, message: "Error Processing Request"});
    }
}

module.exports = { getDirections, validateAPIToken, generateAPIToken, addPharmacy, checkPharmacy }