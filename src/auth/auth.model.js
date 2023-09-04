const pool = require('../config/db.config');
const wmCommon = require('../common/common.model');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const eventLogger = require('../services/auditlog.service');
const encrypt_decrypt = require('../services/decrypt.js');

const userLogin = async (req, res) => {
    try {
        const [getUser, guf] = await pool.pool1.execute(`SELECT wu.userId, wu.userRole, wu.pharmId, wu.userFirstName, wu.userLastName, wu.userPassword, wu.lastLogin FROM wm_users wu JOIN wm_pharmacy wp ON wu.pharmId=wp.pharmId WHERE wu.userEmail=? AND wu.isActive=? AND wp.pharmDomain=?`, [req.body.email, '1', req.body.pharmDomain]);
        if(getUser.length == 1 && bcrypt.compareSync(req.body.password, getUser[0].userPassword)){
            const userCreds = { firstName: getUser[0].userFirstName, lastName: getUser[0].userLastName, userEmail: req.body.email, userRole: getUser[0].userRole, userId: getUser[0].userId, pharmaId: getUser[0].pharmId, lastLogin: getUser[0].lastLogin }

            var token = jwt.sign(userCreds, process.env.JWT_SECRET, { expiresIn: '1h' });
            const [addToken, atf] = await pool.pool1.execute(`UPDATE wm_users SET userJWTToken=? WHERE userId=?`, [token, getUser[0].userId]);

            //Audit Log Start
            const userEventLogger = new eventLogger(req);
            var actionDescription = 'WM Login';
            await userEventLogger.log(0, getUser[0].userId, 'Read', 'WM Login', actionDescription, getUser[0].userId, 'Auth', 'WM User', getUser[0].userRole);
            //Audit Log End
            res.status(200).send({error: false, message: 'You are logged in'});
        }
        else{
            res.status(400).send({error : true, "Message" : "wrong email/password combination"});
        }
    } catch (error) {
        console.log(error);
        res.status(400).send({error : true, "Message": "Error Processing Request"});
    }
}

let verifyToken = function(req, res, next){
    var token = req.body.token || req.query.token || req.headers['token'];
	 if (token) {
		jwt.verify(token, process.env.JWT_SECRET, function (err, user) {
			if (err) {
				res.status(401).send({error: true, message: "Unauthorized Access"});
			} else {
				req.user = user;
                next();
			}
		});
	}
	 else {
		res.status(401).send({error: true, message: "Unauthorized Access."});
	}
}

const userRegistration = async (req, res) => {
    try {
        const pharmToken = encrypt_decrypt.encryptData(req.body.pharmName+req.body.pharmCity+req.body.pharmAddr);

        const [addPharm, apf] = await pool.pool1.execute(`INSERT INTO wm_pharmacy(pharmName, pharmAddress, pharmCity, pharmPostcode, pharmContact, pharmLanguage, pharmToken) VALUES (?, ?, ?, ?, ?, ?, ?)`, [req.body.pharmName, req.body.pharmAddr, req.body.pharmCity, req.body.pharmZip, req.body.pharmContact, req.body.languages, pharmToken]);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const userToken = encrypt_decrypt.encryptData(req.body.adminFirstName+req.body.pharmName+req.body.adminEmail);

        const [addUser, auf] = await pool.pool1.execute(`INSERT INTO wm_users(pharmId, userFirstName, userLastName,	userEmail, userPassword, userToken) VALUES (?, ?, ?, ?, ?, ?)`, [addPharm.insertId, req.body.adminFirstName, req.body.adminLastName, req.body.adminEmail, hashedPassword, userToken]);

        res.status(200).send({error: false, Message: "Registration Successful"});
    } catch (error) {
        console.log(error);
        res.status(400).send({error : true, "Message": "Error Processing Request"});
    }
}