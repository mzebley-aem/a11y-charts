const {chromium,webkit}=require(process.cwd() + '/packages/line-chart/node_modules/@playwright/test');
const fs=require('node:fs');
const output=process.env.AUDIT_OUTPUT||'audit-evidence/2026-11-09/spp-apr';
const phase=process.env.AUDIT_PHASE||'before';
const base=process.env.AUDIT_BASE||'https://a11y-charts-report-preview.vercel.app';
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
const results={base,browser:browser.version(),errors:[],states:[],widths:[],keyboard:[],functional:[]};
page.on('pageerror',e=>results.errors.push(e.message));
for(const [indicator,measures] of [['2',['2']],['5',['5A','5B','5C']],['6',['6A','6B','6C']]]) {
 for(const measure of measures) for(const view of ['trend','comparison']) {
  await page.goto(`${base}/spp-apr/?indicator=${indicator}&measure=${measure}&view=${view}`);
  await page.locator('#chart-stage .a11y-line-chart__title, #chart-stage .a11y-bar-chart__title').waitFor();
  await page.addScriptTag({path:'packages/line-chart/node_modules/axe-core/axe.min.js'});
  const run=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','wcag2aaa']}}));
  const structure=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    const refs=[...document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby]')].flatMap(e=>['aria-controls','aria-labelledby','aria-describedby'].flatMap(attribute=>(e.getAttribute(attribute)||'').split(/\s+/).filter(Boolean).filter(id=>!document.getElementById(id)).map(id=>({element:e.tagName,attribute,id}))));
    return { title:document.title,language:document.documentElement.lang,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),missingReferences:refs,headings:[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({level:e.tagName,text:e.textContent})),links:[...document.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.href}))};
  });
  const state={indicator,measure,view,structure,violations:run.violations.map(v=>({id:v.id,impact:v.impact,tags:v.tags,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))};
  results.states.push(state);fs.writeFileSync(`${output}/${phase}.json`,JSON.stringify(results,null,2));
 }
}
await page.goto(`${base}/spp-apr/?indicator=6&measure=6B&view=comparison`);
await page.locator('#chart-stage').getByRole('button',{name:'Explain',exact:true}).click();
results.functional.push({name:'comparison-explanation',text:await page.locator('#chart-stage').innerText()});
await page.screenshot({path:`${output}/${phase}-comparison.png`,fullPage:true});
await page.locator('#indicator-nav a[href="?indicator=5"]').click();
await page.locator('#measure-nav button[data-measure="5B"]').click();
const beforeBack=page.url();await page.goBack({waitUntil:'domcontentloaded'});await page.waitForLoadState('load');results.functional.push({name:'history',before:beforeBack,after:page.url()});
await page.goto(`${base}/spp-apr/`); await page.keyboard.press('Tab'); results.keyboard.push({step:'first-tab',active:await page.evaluate(()=>document.activeElement.outerHTML)});await page.keyboard.press('Enter');await page.waitForTimeout(100);results.keyboard.push({step:'skip-enter',active:await page.evaluate(()=>document.activeElement.id)});
await page.goto(`${base}/spp-apr/?indicator=5&measure=5A&view=trend`);
for(const width of [320,375,390,480,640,768,1024,1280,1440]) {
 await page.setViewportSize({width,height:900}); await page.locator('.display-settings summary').click();
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,smallTargets:[...document.querySelectorAll('button,a,summary,input,select,textarea')].filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0).map(e=>({text:(e.textContent||e.getAttribute('aria-label')||e.id).trim().slice(0,70),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})).filter(e=>e.width<24||e.height<24)}));
 results.widths.push(metrics);
 if([320,390,768,1440].includes(width))await page.screenshot({path:`${output}/${phase}-${width}.png`,fullPage:true});
 await page.locator('.display-settings summary').click();
}
await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await page.screenshot({path:`${output}/${phase}-forced-colors.png`,fullPage:true});
await page.emulateMedia({forcedColors:'none'});
await page.addStyleTag({content:'* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }'});
await page.setViewportSize({width:320,height:900});results.textSpacing=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));await page.screenshot({path:`${output}/${phase}-text-spacing.png`,fullPage:true});
fs.writeFileSync(`${output}/${phase}.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify({states:results.states.length,violations:results.states.filter(s=>s.violations.length).map(s=>({measure:s.measure,view:s.view,violations:s.violations.map(v=>v.id)})),widths:results.widths,keyboard:results.keyboard,functional:results.functional,errors:results.errors,textSpacing:results.textSpacing},null,2));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
