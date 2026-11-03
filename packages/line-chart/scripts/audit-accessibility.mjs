import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url), out=resolve(process.env.AUDIT_OUTPUT||'../../audit-evidence/2026-10-21');
await mkdir(out,{recursive:true});
const base=process.env.AUDIT_BASE||'http://127.0.0.1:5189';
const routes=[['gallery','/demo-gallery/index.html'],['line-source','/packages/line-chart/demo/dev.html'],['line-standalone','/packages/line-chart/demo/index.html'],['report','/packages/line-chart/demo/report-demo.html'],['bar-standalone','/packages/bar-chart/demo/index.html']];
const browser=await chromium.launch({channel:'chrome',headless:true}), ledger=[],scans=[];
for(const [name,path] of routes){
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));const response=await page.goto(base+path);await page.waitForTimeout(500);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 async function scan(state){const r=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','wcag2aaa','best-practice']},rules:{'color-contrast-enhanced':{enabled:true}}}));scans.push({route:name,state,violations:r.violations,incomplete:r.incomplete.map(({id,impact,nodes})=>({id,impact,nodes})),passes:r.passes.map(x=>x.id)});}
 await scan('default');
 const structure=await page.evaluate(()=>({title:document.title,lang:document.documentElement.lang,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,charts:document.querySelectorAll('a11y-line-chart,a11y-bar-chart').length,headings:[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e=>({level:e.tagName,text:e.textContent})),badReferences:[...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')].flatMap(e=>['aria-labelledby','aria-describedby','aria-controls'].flatMap(a=>(e.getAttribute(a)||'').split(/\s+/).filter(id=>id&&!document.getElementById(id)).map(id=>({tag:e.tagName,attribute:a,id})))),positiveTabindex:[...document.querySelectorAll('[tabindex]')].filter(e=>+e.getAttribute('tabindex')>0).length,links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.textContent.trim(),href:e.href}))}));
 const viewports=[];
 for(const width of [320,375,390,480,640,768,1024,1280,1440]){await page.setViewportSize({width,height:900});await page.waitForTimeout(80);viewports.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth-innerWidth})));}
 await page.setViewportSize({width:1280,height:900});
 const allData=page.getByRole('button',{name:/^(Data|View complete data)$/});let dialogCount=0;
 for(let i=0;i<await allData.count();i++){if(!await allData.nth(i).isVisible())continue;await allData.nth(i).click();if(await page.locator('dialog[open]').count()){await scan(`dialog-${i+1}`);dialogCount++;await page.keyboard.press('Escape');}}
 await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
 for(const b of await page.getByRole('button',{name:/^(Explain|Glossary|Show definitions)$/}).all()){if(await b.isVisible()&&await b.getAttribute('aria-expanded')==='false')await b.click();}
 await scan('expanded');
 const language=page.locator('[data-demo-locale], select#locale');
 if(await language.count()){
  for(const locale of ['fr-FR','es-ES']){await language.first().selectOption(locale);await page.waitForTimeout(100);await scan(`locale-${locale}`);}
  await language.first().selectOption('en-US');
 }
 await page.setViewportSize({width:320,height:900});await page.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
 const textSpacing=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));await page.screenshot({path:resolve(out,`${name}-320-spacing.png`),fullPage:true});
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await page.screenshot({path:resolve(out,`${name}-forced-colors.png`)});
 ledger.push({name,url:base+path,status:response.status(),errors,structure,viewports,textSpacing,dialogCount});await page.close();
 await writeFile(resolve(out,'routes.json'),JSON.stringify(ledger,null,2));await writeFile(resolve(out,'axe.json'),JSON.stringify(scans,null,2));
}
await browser.close();console.log(JSON.stringify({routes:ledger.map(r=>({name:r.name,charts:r.structure.charts,errors:r.errors,overflow:r.viewports.filter(v=>v.overflow>0),textSpacing:r.textSpacing})),scans:scans.map(s=>({route:s.route,state:s.state,violations:s.violations.map(v=>({id:v.id,count:v.nodes.length,impact:v.impact}))}))},null,2));
