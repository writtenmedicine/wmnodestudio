const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');
const decrypt = require('./decrypt')
var JWTverification = async (req, res, next) => {
    console.log('LOL')
    try {
        if (req.method == "POST" || req.method == "PUT") {
            console.log(req.body)
            console.log("Inside JWT ")
            console.log(req.body)
            cid = parseInt(decrypt(req.headers.cid));
            console.log(cid)
            req.app.locals.cid =cid;
            req.body.cid = cid;
            user_id = parseInt(decrypt(req.headers.user_id));
            req.app.locals.user_id = user_id;
            req.body.user_id = user_id;
            req.body.userId = user_id;
            jwt_token = req.headers.jwt;
            console.log(jwt_token)
            mobile = parseInt(req.headers.mobile);
            console.log(mobile)
        } else {
            console.log("Inside JWT GET")
            cid = parseInt(decrypt(req.headers.cid));
            req.query.cid = cid;
            req.params.companyId = cid;
            req.app.locals.cid =cid;
            console.log(cid);
            user_id = parseInt(decrypt(req.headers.user_id));
            console.log(user_id)
            req.query.user_id = user_id;
            req.params.userId = user_id;
            jwt_token = req.headers.jwt;
            console.log(jwt_token)
            mobile = parseInt(req.headers.mobile);
            console.log(mobile)
        }
        
        if (mobile || mobile == 1) {
            console.log('Q1')
            const [keyData, kf] = await pool.pool2.execute(`SELECT user_mobilekey FROM table_app_users WHERE user_id=? AND user_companyid=? AND user_status=? AND user_inactive=0`, [user_id, cid, '1']);
            userkey = keyData[0];
            console.log(user_key)
            jwt.verify(jwt_token, userkey.user_mobilekey)
        } else {
            console.log('Q2')
            const [keyWeb, kwFields] = await pool.pool2.execute(`SELECT user_key FROM table_app_users WHERE user_id=? AND user_companyid=? AND user_status=? AND user_inactive=0`, [user_id, cid, '1']);
            userkey = keyWeb[0];
            console.log(userkey, '=>', jwt_token);
            jwt.verify(jwt_token, userkey.user_key)
        }
        next();
    } catch (err) {
        console.log(" JWT ERROR")
        res.status(401).json({
            status:401,
            message:"unauthorised access!"
        });
    }
};
module.exports = JWTverification;
