'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const {createApp} = require('../server');
const schema = require('../schema');

(async () => {
    const sent = [];
    let rejectMail = true;
    const app = createApp({env: {}, mailConfig: {from:'forms@example.test', to:'clinic@example.test'}, emailSender: async payload => {
        if (rejectMail) return {error: {name:'test-rejection'}};
        sent.push(payload);
        return {data:{id:'browser-qa'}};
    }});
    const server = await new Promise(resolve => {const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const installedChrome = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe');
    let browser;
    try {
        browser = await puppeteer.launch({headless:true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === 'win32' && fs.existsSync(installedChrome) ? installedChrome : undefined)});
        const page = await browser.newPage();
        const errors=[];
        page.on('pageerror', e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle0'});
        for (const width of [1440,768,320]) {
            await page.setViewport({width,height:1000});
            const layout=await page.evaluate(()=>{
                const logo=document.querySelector('.logo-panel').getBoundingClientRect();
                const copy=document.querySelector('.header-copy').getBoundingClientRect();
                return {overflow:document.documentElement.scrollWidth>innerWidth, logoWidth:logo.width, beside:logo.left>=copy.right-1, loaded:document.querySelector('.clinic-logo').naturalWidth>0};
            });
            assert.equal(layout.overflow,false,`overflow at ${width}`);
            assert.equal(layout.beside,true,`logo side position at ${width}`);
            assert.equal(layout.loaded,true);
            assert.ok(layout.logoWidth<=150);
            await page.screenshot({path:path.join(__dirname,`form-${width}.png`), fullPage:true});
        }
        assert.equal(await page.$eval('html', e=>e.dir),'rtl');
        assert.equal(await page.$$eval('input,select,textarea', e=>e.length),schema.fields.length);
        await page.click('#submit-button');
        await page.waitForSelector('#message-dialog[open]');
        assert.match(await page.$eval('#dialog-title', e=>e.textContent),/שדות החובה/);
        await page.click('#dialog-close');
        const data={patientName:'מטופל בדיקה',patientPhone:'0521234567',address:'כתובת בדיקה',patientId:'123456789',age:'42',gender:'זכר',referralReason:'נתוני דמה בלבד',treatmentType:'תרגול לדוגמה',treatmentCount:'24',recommendations:'המלצות לדוגמה בלבד',physiotherapistName:'מטפל בדיקה',licenseNumber:'12345',examinationDate:'2026-10-27'};
        await page.evaluate(data=>{for(const [key,value] of Object.entries(data)){const input=document.getElementById(key);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}},data);
        await page.$eval('#treatmentCount', e=>{e.value='25';e.dispatchEvent(new Event('input'));});
        assert.equal(await page.$eval('#treatmentCount', e=>e.checkValidity()),false);
        await page.$eval('#treatmentCount', e=>{e.value='24';e.dispatchEvent(new Event('input'));});
        await page.click('#submit-button');
        await page.waitForSelector('#message-dialog[open]',{timeout:60000});
        assert.match(await page.$eval('#dialog-title', e=>e.textContent),/לא הושלמה/);
        await page.click('#dialog-close');
        assert.equal(await page.$eval('#recommendations', e=>e.value),data.recommendations);
        rejectMail=false;
        await page.click('#submit-button');
        await page.waitForSelector('#message-dialog[open]',{timeout:60000});
        assert.match(await page.$eval('#dialog-title',e=>e.textContent),/בהצלחה/);
        assert.equal(sent.length,1);
        fs.writeFileSync(path.join(__dirname,'sample.pdf'),Buffer.from(sent[0].attachments[0].content,'base64'));
        await page.click('#dialog-close');
        await page.waitForFunction(()=>document.getElementById('patientName').value==='');
        assert.deepEqual(errors,[]);
        console.log(JSON.stringify({widths:[1440,768,320],fields:schema.fields.length,validation:true,failurePreservesData:true,successReset:true,realPdf:true,emailTransport:'mock',pageErrors:errors}));
    } finally {if (browser) await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
