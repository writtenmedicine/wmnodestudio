const pool = require('../config/db.config');
const puppeteer = require("puppeteer");
const fs = require("fs");
const commonFunctions = require('../common/common.model');
const { v4: uuidv4 } = require('uuid');

const triggerPDFGeneration = async (req, res) => {
    try {
        var pdfResult = '';
        var labelData = [];
        var labels = JSON.parse(req.body.labelIds);
        var patientId = parseInt(req.body.patientId);
        if(patientId == 0 && labels.length > 0){
            await commonFunctions.asyncForEach(labels, async (ele, i) => {
                //get BNF Warnings
                const [getWarns, gwf] = await pool.pool1.execute(`SELECT patientLanguage, labelWarnings FROM wm_labels WHERE labelId=?`, [ele]); 
                var allWarns = JSON.parse(getWarns[0].labelWarnings);
                var getWarnings = [];
                if(allWarns.length > 0){
                    var warningArray = allWarns.map(function(elem){ return elem.warn_id; }).join(",")
                
                    [getWarnings, gwsf] = await pool.pool1.execute(`SELECT warn_eng, warn_trans FROM ${(getWarns[0].patientLanguage).toLowerCase()}_warning WHERE warn_id IN (${warningArray})`);
                }

                const [getLabels, glf] = await pool.pool1.execute(`SELECT labelId, patientId, pharmId, drugId, custDrugId, drugQuantity, custDrug, engDrug, transDrug, patientName, patientLanguage, labelCreatedDate, labelModifiedAt, engDirection, transDirection, direction_img, labelCreatedBy, labelModifiedBy, labelUrl, drugType, isActive FROM wm_labels WHERE labelId=?`, [ele]);
                getLabels[0].labelWarnings = JSON.stringify(getWarnings);
                labelData.push(getLabels[0]);
            })
            if(req.body.labelType == 'PDF'){
                pdfResult = await generatePDFLabel('file', '', labelData, labelData[0].patientLanguage);
            }
            if(req.body.labelType == 'A4'){
                var labelDataA4 = [];
                await commonFunctions.asyncForEach(labels, async (ele, i) => {
                    const [getA4Label, ga4lf] = await pool.pool1.execute(`SELECT wml.*, wp.patientAddr1, wp.patientAddr2, wp.patientHospital, wmph.pharmName, CONCAT_WS(' ', wmph.pharmAddress, wmph.pharmCity, wmph.pharmPostcode) AS pharmAddress, wmph.pharmContact, wps.pharmLogo FROM wm_labels wml INNER JOIN wm_patients wp on wml.patientId=wp.patientId INNER JOIN wm_pharmacy wmph on wml.pharmId=wmph.pharmId LEFT JOIN wm_pharmacy_settings wps ON wml.pharmId=wps.pharmId WHERE wml.labelId=?`, [ele]);
                    labelDataA4[i] = getA4Label;
                })
            }
            /* if(req.body.labelType == 'ALT'){}
            if(req.body.labelType == 'PDFTRANS'){}
            if(req.body.labelType == 'MAR_WEEK'){}
            if(req.body.labelType == 'MAR_MONTH'){} */
        }
        else{
            const [getAllLabels, galf] = await pool.pool1.execute(`SELECT * FROM wm_labels WHERE patientId=? AND isActive=? ORDER BY labelId ASC`, [patientId, '1']);
            labelData = getAllLabels;
        }
        console.log(pdfResult);
        res.status(200).send({error: false, message: "Done", data: pdfResult.data});
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, message: "Error Processing Request"});
    }
}

const generatePDFA4 = async (req, res) => {
    try {
        // Get type of source from process.argv, default to url
        var type = req.body.type;

        // Create a browser instance
        const browser = await puppeteer.launch();

        // Create a new page
        const page = await browser.newPage();

        if (type === "url") {
            // Web site URL to export as pdf
            const website_url = req.body.url;

            // Open URL in current page
            await page.goto(website_url, { waitUntil: "networkidle0" });
        } else if (type === "file") {
            //Get HTML content from HTML file
            //const html = fs.readFileSync("./src/labels/test.html", "utf-8");
            await page.setContent(datahtml, { waitUntil: "domcontentloaded" });
        } else {
            console.log(new Error(`HTML source "${type}" is unkown.`));
            await browser.close();
            return;
        }
        // To reflect CSS used for screens instead of print
        await page.emulateMediaType("screen");
        
        var fileName = uuidv4();
        var pdfPath = `/var/www/html/temp/${fileName}.pdf`;
        // Downlaod the PDF
        const pdf = await page.pdf({
            path: pdfPath,
            margin: { top: "100px", right: "50px", bottom: "100px", left: "50px" },
            printBackground: true,
            format: "A4",
        });
        // Close the browser instance
        await browser.close();
        res.status(200).send({error: false, Message: "PDF Generated Successfully", data: pdfPath});
    } catch (error) {
        console.log(error);
        res.status(400).send({error: true, Message: 'Error Processing Request'}); 
    }
};

const generatePDFLabel = async (type, url, labelData, language) => {
    try {
        console.log(labelData);
        // Create a browser instance
        const browser = await puppeteer.launch();

        // Create a new page
        const page = await browser.newPage();

        if (type === "url") {
            // Web site URL to export as pdf
            const website_url = url;

            // Open URL in current page
            await page.goto(website_url, { waitUntil: "networkidle0" });
        } else if (type === "file") {
            //Get HTML content from HTML file
            //const html = fs.readFileSync("sample.html", "utf-8");
            //generateHTML
            var jsonLabel = labelData;
            var headerData = '';
            var footerData = '';
            var labelBody = '';
            await commonFunctions.asyncForEach(jsonLabel, async (ele, i) => {
                if(ele.drugType == '1'){
                    headerData = '<div style="vertical-align:top; font-size:8pt;border-bottom: 1px solid;line-height:97%;"><strong>'+ele.drugQuantity+' '+ele.custDrug+'</strong></div>';
                }
                else{
                    headerData = '<div style="vertical-align:top; font-size:8pt;border-bottom: 1px solid;line-height:97%;"><strong>'+ele.drugQuantity+' '+ele.engDrug+'</strong></div>'
                }
                footerData = '<table width="100%" style="vertical-align:top; font-size:8pt;border-top:1px solid;line-height:97%;"><tr><td colspan="3" style="text-align:center;font-size:6pt;">Keep out of the sight and reach of children</td></tr><tr><td width="60%">' + ele.patientName +'</td><td width="20%" style="text-align:center;">{DATE '+commonFunctions.formatDate(new Date())+'}</td><td width="20%" style="text-align:right;">' + ele.patientLanguage + '</td></tr></table>';

                labelBody = '<table>'+			
                '<tr>'+
                    '<td colspan="2" class="print_name_translated">'+ ele.transDrug +'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="print_directions" width="50%" valign="top">'+ ele.engDirection +'</td>'+
                    '<td dir="auto" class="print_directions_translated" valign="top">'+ ele.transDirection +'</td>'+
                '</tr>';
                var warns = JSON.parse(ele.labelWarnings);
                if(warns && warns[0] !== false){
                    await commonFunctions.asyncForEach(warns, async (el, j) => {
                        labelBody += '<tr>'+
                        '<td class="print_warnings" valign="top">'+ el.warn_eng +'</td>'+
                        '<td dir="auto" class="print_warnings_translated" valign="top">'+ el.warn_trans +'</td>'+
                        '</tr>';
                    })			
                }		
                labelBody += '</table>';
            })
            await page.setContent(labelBody, { waitUntil: "domcontentloaded" });
        } else {
            console.log(new Error(`HTML source "${type}" is unkown.`));
            await browser.close();
            return;
        }
        // To reflect CSS used for screens instead of print
        await page.emulateMediaType("screen");

        var fileName = uuidv4();
        var pdfPath = `/var/www/html/temp/${fileName}.pdf`;
        var finalFile = `temp/${fileName}.pdf`;
        // Downlaod the PDF
        const pdf = await page.pdf({
            path: pdfPath,
            margin: { top: "30px", right: "20px", bottom: 0, left: "20px" },
            printBackground: true,
            //format: "A4",
            height: 79.37 + 'mm',
            width: 198.43 + 'mm',
            landscape: false,
            displayHeaderFooter: true,
            headerTemplate: headerData,
            footerTemplate: footerData
        });
        // Close the browser instance
        await browser.close();
        return {error: false, Message: "PDF Generated Successfully", data: finalFile}
  } catch (error) {
        console.log(error);
        return {error: true, Message: 'Error Processing Request'};
  }
};

module.exports = {triggerPDFGeneration, generatePDFA4}