const pool = require('../config/db.config');
const cfSign = require('aws-cloudfront-sign');
const fs = require('fs');
const AWS = require('aws-sdk');

async function asyncForEach(array, callback) {
    for (let i = 0; i < array.length; i++) {
        await callback(array[i], i);
    }
}

const s3 = new AWS.S3({
    accessKeyId: process.env.S3_KEY_ID,
    secretAccessKey: process.env.S3_KEY
});

const uploadFile = (fileName, cb) => {
    var upFile = 'reports/dailyTrackerReport.'+Date.now()+'.csv';
  fs.readFile(fileName, async (err, data) => {
     if (err) throw err;
     const params = {
         Bucket: process.env.S3_BUCKET, // pass your bucket name
         ACL: 'public-read',
         Key: upFile, // file will be saved as testBucket/contacts.csv
         Body: data,
        ContentType: 'application/octet-stream',
        CacheControl: 'public, max-age=86400'
     };
     // S3 ManagedUpload with callbacks is not supported in AWS SDK for JavaScript (v3).
     // Please convert to 'await client.upload(params, options).promise()', and re-run aws-sdk-js-codemod.
     s3.upload(params, async (s3Err, data) => {
         if (s3Err) throw s3Err
         var locationUrl = await getSignedUrl(upFile);
         return cb(null, {reportUrl: locationUrl})
     });
  });
};

const getSignedUrl = async (url)=>{
    const signingParams = {
        keypairId: process.env.CLOUD_FRONT_KEYPAIR_ID,
        privateKeyPath: require('path').join(process.env.CLOUDFRONT_KEY),
        expireTime: new Date().getTime() + 90480000,
    };
    // Generating a signed URL
    const signedUrl = cfSign.getSignedUrl(
        `${process.env.CLOUD_FRONT_URL}${url}`,
        signingParams,
    );
    return signedUrl;
}

function weekOfMonth() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var week = 1;
    // for each day since the start of the month
    for (var i = 1; i <= day; ++i) {
        // if that day was a sunday and is not the first day of month
        var newDate = new Date(month+'/'+i+'/'+year)
        if (i > 1 && newDate.getDay() == 1) {
            // increment current week
            ++week;
        }
    }
    // now return
    return week;
}

function dateDiff(date1, date2) {
    date1.setHours(0);
    date1.setMinutes(0, 0, 0);
    date2.setHours(0);
    date2.setMinutes(0, 0, 0);
    var datediff = Math.abs(date1.getTime() - date2.getTime()); // difference 
    return parseInt(datediff / (24 * 60 * 60 * 1000), 10); //Convert values days and return value      
}

function create_UUID(dataKey){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + dataKey + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function formatDate(date) {
    date = new Date(date);
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dateString = //weekdayNames[date.getDay()] + " "
        // + date.getHours() + ":" + ("00" + date.getMinutes()).slice(-2) + " "
        + date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear();
    return dateString;
}

function generateString(length) {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function sendEmailsCommon(smtpDetails, mailOptions, emailCategory, pharmId, sendtoUserId) {
    try {
        let transporter = nodemailer.createTransport({
            host: smtpDetails.smtp_host,
            port: smtpDetails.smtp_port,
            secure : false,
            auth: {
                user: smtpDetails.smtp_username,
                pass: smtpDetails.smtp_password,
            },
        });
        transporter.sendMail(mailOptions, async function (error, info) {
            console.log(error, info);
            if (error) {
                const [emailTrack, emailTrackFields] = await pool.pool1.execute("INSERT INTO wm_trackemail (email_category, email_subject, email_body, email_sendtoemail, email_senderemail, email_cc, email_bcc, email_fromname, email_pharmId, email_timestamp, email_sendtouserid, email_senderuserid, email_sendgrid_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)", [emailCategory, emailSubject, bodyHtml, toEmail[0].email, fromEmail.email, JSON.stringify(ccEmail), JSON.stringify(bccEmail), fromEmail.name, pharmId, sendtoUserId, 0, error.code+": " +JSON.stringify(error)]);
                return {
                    status: error.code,
                    message: error
                };
            } else {
                const [emailTrack, emailTrackFields] = await pool.pool1.execute("INSERT INTO wm_trackemail (email_category, email_subject, email_body, email_sendtoemail, email_senderemail, email_cc, email_bcc, email_fromname, email_pharmId, email_timestamp, email_sendtouserid, email_senderuserid, email_sendgrid_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)", [emailCategory, emailSubject, bodyHtml, toEmail[0].email, fromEmail.email, JSON.stringify(ccEmail), JSON.stringify(bccEmail), fromEmail.name, pharmId, sendtoUserId, 0, info.response]);
                return {
                    status: 200,
                    message: "Email sent: " + info.response
                };
            }
        });
    } catch (error) {
        console.log(error);
        return {
            status: 500,
            message: "Email sending failed"
        }
    }
    
}

function decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

module.exports = {asyncForEach, dateDiff, getSignedUrl, weekOfMonth, create_UUID, formatDate, generateString}