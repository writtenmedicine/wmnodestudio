const pool = require('../config/db.config');
const UAParser = require('ua-parser-js');
const { hostname } = require('os');

class eventLogger {
    constructor(request) {
        this.request = request;
    }

    log(companyId, actorId, action, actionLabel, actionDescription, sourceId, source, sourceLabel,roleType) {
        const parser = new UAParser(),
        ua = this.request.headers['user-agent'],
        browserName = parser.setUA(ua).getBrowser().name,
        fullBrowserVersion = parser.setUA(ua).getBrowser().version,
        browserVersion = (fullBrowserVersion && fullBrowserVersion.trim() !== '') ? fullBrowserVersion.split('.', 1).toString() : '',
        browserVersionNumber = (browserVersion && browserVersion.trim() !== '') ? Number(browserVersion) : '',
        os = parser.setUA(ua).getOS().name ? parser.setUA(ua).getOS().name : '',
        proxyIp = this.request.ip || '',
        clientIp = this.request.connection.localAddress || '',
        clientPort = this.request.connection.localPort ? this.request.connection.localPort.toString() : '',
        ip = (this.request.headers['x-forwarded-for'] || this.request.connection.remoteAddress || '').split(',')[0].trim(),
        browser = `${browserName ? browserName : ''}-${browserVersionNumber ? browserVersionNumber.toString() : ''}`,
        computerName = hostname() || '',
        serverIp = this.request.connection.localAddress || '',
        serverPort = this.request.connection.localPort ? this.request.connection.localPort.toString() : '',
        userAgent = this.request.headers['user-agent'] || '';

        console.log([companyId, action, actionLabel, actorId, actionDescription, ip, sourceId, sourceLabel, source, userAgent, roleType, roleType]);

        return pool.pool1.execute('INSERT INTO bm_audit_log (log_cid,log_action,log_actionlabel,log_actorid,log_description,log_ipaddress,log_sourceid,log_sourcelabel,log_sourcetype,log_useragent,log_roleid,log_roletype) Values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [companyId, action, actionLabel, actorId, actionDescription, ip, sourceId, sourceLabel, source, userAgent, roleType, roleType]); 
    }
}

module.exports = eventLogger;
