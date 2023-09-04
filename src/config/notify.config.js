const Oxen = require('oxen-queue');
require('dotenv/config');
const oxNotify = new Oxen({
    mysql_config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    },
    db_table: process.env.BM_PROCESS_QUEUE,
    job_type: process.env.BM_JOB_TYPE,
});

module.exports = {oxNotify}