#!/usr/bin/env bash
# Updates the Lite web app in this repository, then publishes it. Run from the repository root.
set -e
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Run this inside your tradie-kit repository folder."; exit 1; }
mkdir -p app
cat > app/index.html <<'TK_EOF'
<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Tradie Paperwork Kit</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🧾%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="app.css">
</head>
<body>
<nav id="nav" role="tablist" aria-label="Kit tabs"></nav>
<main id="m"></main>
<datalist id="dl"></datalist>
<script src="app.js"></script>
</body>
</html>
TK_EOF
cat > app/app.css <<'TK_EOF'
:root{--navy:#1f2a44;--or:#f28c28;--in:#fffbeb;--calc:#f1f4f9;--line:#d9dee7;--mut:#6b7280;--bad:#b42318;color-scheme:light}
*{box-sizing:border-box}html{scroll-padding-top:60px}
body{margin:0;background:#e9edf3;color:#1f2937;font:14px/1.45 Arial,Helvetica,sans-serif}
nav{position:sticky;top:0;z-index:5;background:var(--navy);display:flex;overflow-x:auto;gap:3px;padding:max(6px,env(safe-area-inset-top)) 8px 0}
nav button{flex:none;border:0;background:#33405f;color:#cfd6e6;padding:10px 14px;border-radius:8px 8px 0 0;font:700 13px Arial,sans-serif;cursor:pointer}
nav button[aria-selected=true]{background:#fff;color:var(--navy);box-shadow:inset 0 -3px var(--or)}
.pg{max-width:900px;margin:14px auto;background:#fff;padding-bottom:16px;box-shadow:0 1px 6px #0002}
.band{background:var(--navy);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 16px}
.band b{font-size:20px}.band i{font-style:normal;font-size:22px;font-weight:700;color:var(--or);text-align:right}
.sub{background:var(--navy);color:#fff;font-size:12px;padding:0 16px 10px;border-bottom:4px solid var(--or)}
.leg{margin:8px 16px;color:var(--mut);font-size:12px}.leg.bad{color:var(--bad);font-weight:700;font-size:14px}
.dfm{margin:2px 0 0;color:var(--mut);font-size:12px}
.sec{color:var(--or);font:700 11px Arial,sans-serif;letter-spacing:.06em;border-bottom:1px solid var(--line);margin:16px 16px 6px;padding-bottom:4px}
.fr{display:grid;grid-template-columns:150px 1fr;gap:3px 10px;margin:4px 16px;align-items:start}
.fr label{font-weight:700;color:var(--navy);font-size:12px;padding-top:10px}
.ex{grid-column:2;color:var(--mut);font-size:11px;font-style:italic}
input,select,textarea{font:16px Arial,sans-serif;border:1px solid var(--line);background:var(--in);padding:8px;border-radius:4px;width:100%;color:#1f2937}
textarea{resize:none;overflow:hidden;min-height:38px}
.cv{background:var(--calc);border:1px solid var(--line);padding:8px;min-height:38px;border-radius:4px;font-weight:700}
.ln{display:grid;grid-template-columns:28px 1fr 70px 112px 74px 112px;gap:4px;margin:3px 16px;align-items:center}
.ln.ni{grid-template-columns:28px 1fr 70px 112px 112px}
.ln .nn{color:var(--mut);text-align:center;font-size:12px}.ln .am{text-align:right;font-weight:700;background:var(--calc);padding:8px;border-radius:4px;min-height:38px}
.ln.th span{background:var(--navy);color:#fff;font:700 11px Arial,sans-serif;padding:8px 6px;text-align:center}
.tr{display:flex;justify-content:space-between;margin:2px 16px;padding:4px 10px;font-weight:700}
.big{background:var(--navy);color:#fff;font-size:15px;margin-top:6px;padding:10px}
.warn{margin:8px 16px;color:var(--bad);font-weight:700}.note{margin:6px 16px;color:var(--mut);font-size:12px}
.pay{margin:4px 16px;font-size:13px}.pay b{color:var(--navy)}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin:16px}
.b{border:0;border-radius:6px;padding:12px 18px;font:700 15px Arial,sans-serif;cursor:pointer;background:var(--navy);color:#fff}.b.o{background:var(--or);color:var(--navy)}.b.g{background:#fff;color:var(--navy);border:1px solid var(--line)}
.st{display:grid;grid-template-columns:28px 1fr;margin:8px 16px;gap:6px}.st b{color:var(--or);font-size:16px}
@media(max-width:640px){
.fr{grid-template-columns:1fr}.fr label{padding-top:6px}.ex{grid-column:1}
.ln{grid-template-columns:22px .8fr 1.4fr .9fr 1.3fr}.ln.ni{grid-template-columns:22px .8fr 1.4fr 1.3fr}.ln .d{grid-column:2/-1}.ln .q{grid-column:2}.ln.th{display:none}
.band b{font-size:17px}.band i{font-size:18px}}
@media print{nav,.btns,.btns+.note,.ex,.ln.empty,input[type=date]{display:none}.dfm{color:#1f2937;font-size:14px;margin:0;padding-top:8px}::placeholder{color:transparent}body{background:#fff}.pg{box-shadow:none;margin:0;max-width:none}
input,select,textarea{border:0;background:none;padding:2px;appearance:none;-webkit-appearance:none}.cv,.ln .am{background:none;border:0}
.band,.sub,.big,.ln.th span{-webkit-print-color-adjust:exact;print-color-adjust:exact}.leg:not(.bad){display:none}}

#paper,.pbar{display:none}
#paper{max-width:900px;margin:14px auto;background:#fff;padding-bottom:16px;box-shadow:0 1px 6px #0002;font-size:13px}
#paper p{margin:3px 16px}#paper .sm{font-size:11px;color:var(--mut)}
#paper table{width:calc(100% - 32px);margin:10px 16px;border-collapse:collapse}
#paper th{background:var(--navy);color:#fff;text-align:left;padding:6px;font-size:11px}
#paper td{border-bottom:1px solid var(--line);padding:6px;vertical-align:top}#paper .n{text-align:right;white-space:nowrap}
#paper .sg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:30px 16px 0}#paper .sg div{border-top:1px solid #1f2937;padding-top:3px;font-size:11px}
.pbar{max-width:900px;margin:14px auto 0;gap:8px;padding:0 12px}
body.pv .pg{display:none}body.pv #paper{display:block}body.pv .pbar{display:flex}
@media print{body.hasp .pg,.pbar{display:none!important}body.hasp #paper{display:block;box-shadow:none;margin:0;max-width:none}#paper th,#paper .band,#paper .sub,#paper .big{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
TK_EOF
cat > app/app.js <<'TK_EOF'
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const TABS=['Start Here','My Details','Quote','Tax Invoice','Invoice','Variation','Rate Calculator','Line Items','Worked Examples'];
const FOOT='General template for administrative and educational use only. Not legal, tax or WHS advice. Adapt to your business and each job. Have your SWMS reviewed by a qualified WHS professional before use.';
const LISTS={
Electrician:'Labour - licensed electrician|Labour - apprentice|Call-out fee (standard hours)|After-hours or emergency call-out fee|Fault finding and diagnosis|Supply and install double power point (GPO)|Supply and install LED downlight|Supply and install ceiling fan|Supply and install interconnected smoke alarm|Supply and install safety switch (RCD)|Switchboard upgrade (supply and install)|EV charger installation (supply and install)|Data, TV or antenna point|Test and tag (portable appliances)|Materials at cost plus markup|Travel or mobilisation|Compliance paperwork and test results (where required in your state)',
Plumber:'Labour - licensed plumber|Labour - apprentice|Call-out fee (standard hours)|After-hours or emergency call-out fee|Leak detection|Supply and install mixer tap|Replace toilet suite (supply and install)|Hot water system (supply and install)|Remove and dispose of old hot water system|Clear blocked drain|Drain camera inspection|Replace flexible hoses or isolation valves|Pressure limiting or tempering valve (supply and install)|Gas fitting work (licensed gasfitter only)|Materials at cost plus markup|Travel or mobilisation|Permit, inspection or compliance paperwork (where required in your state)',
Other:'Labour - tradesperson|Labour - apprentice or offsider|Call-out fee (standard hours)|After-hours or emergency call-out fee|Quote or site inspection fee|Minimum charge (first hour)|Materials at cost plus markup|Materials supply only|Delivery|Equipment or plant hire|Waste removal and tip fees|Site clean-up|Travel or mobilisation|Progress payment - stage 1|Progress payment - stage 2|Permit, inspection or compliance paperwork (where required in your state)|Other work (describe it)'};
const UN={Electrician:'hour,hour,each,each,hour,each,each,each,each,each,job,job,each,item,lot,each,job',Plumber:'hour,hour,each,each,hour,each,each,each,each,job,job,each,each,hour,lot,each,job',Other:'hour,hour,each,each,each,each,lot,lot,each,day,lot,each,each,stage,stage,job,job'};
const MK='Pick your markup on the Rate Calculator tab.',MH='Your main hourly rate. See the Rate Calculator tab.',CO='Covers travel and the first look.',AH='Say your after-hours times on the quote.',ST_='Check your state rules for where they are required.',NS='Names and rules differ by state.';
const NT={Electrician:{0:MH,2:CO,3:AH,8:ST_,10:'List what is included and what is not.',14:MK,16:'Certificate names and rules differ by state.'},Plumber:{0:MH,2:CO,3:AH,7:'List the model and size.',12:ST_,13:'Only if you hold the licence.',14:MK,16:NS},Other:{0:MH,2:CO,3:AH,4:'Say if it is credited back when the job goes ahead.',6:MK,13:'Describe what the stage covers.',15:NS}};
const EX={Electrician:'Painting, plastering and making good after cable runs (by others).|Asbestos identification, testing or removal.|Repairs to existing wiring found to be unsafe or non-compliant (quoted separately as a variation).|Network provider and council fees, unless listed in this quote.|Work in roof, wall or floor spaces that cannot be safely reached.|Fittings or appliances supplied by the customer (no warranty on supplied items).|Any work not listed in the scope above.',Plumber:'Tiling, plastering, painting and carpentry make-good (by others).|Concrete cutting, excavation and reinstatement.|Asbestos identification, testing or removal.|Hidden or concealed problems found during the work, such as corroded or damaged pipes (quoted separately as a variation).|Permit, inspection and authority fees, unless listed in this quote.|Damage caused by tree roots or ground movement.|Fittings or fixtures supplied by the customer (no warranty on supplied items).',Other:'Painting, plastering and making good (by others).|Asbestos identification, testing or removal.|Hidden or concealed problems found during the work (quoted separately as a variation).|Permit, inspection and authority fees, unless listed in this quote.|Work that cannot be safely reached.|Items supplied by the customer (no warranty on supplied items).|Any work not listed in the scope above.'};
const DEF={'Rate Calculator':{wage:'$90,000.00',costs:'$25,000.00',weeks:'46',hrs:'25',part:'$120.00',mk:'30'},Variation:{pay:'Added to the final invoice',prev:'$0.00'}};
let ST={D:{gst:'Yes',trade:'Electrician',terms:'7',rate:'10'},T:{}},tab='Start Here';
try{const s=JSON.parse(localStorage.getItem('tpk2')||'{}');ST.D={...ST.D,...(s.D||{})};ST.T=s.T||{}}catch(e){}
const save=()=>{try{localStorage.setItem('tpk2',JSON.stringify(ST))}catch(e){}};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const has=s=>String(s??'').trim()!=='',num=s=>parseFloat(String(s??'').replace(/[$,\s]/g,''))||0;
const r2=n=>Math.round((n+Number.EPSILON)*100)/100;
const usd=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD=v=>{if(!has(v))return'';const[a,b,c]=v.split('-');return new Date(a,b-1,c).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})};
const addD=(v,n)=>{if(!has(v))return'';const[a,b,c]=v.split('-'),d=new Date(a,b-1,+c+n);return fmtD(d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate())};
const get=(s,k)=>{const v=s==='D'?ST.D[k]:(ST.T[s]||{})[k];return v!==undefined?v:(DEF[s]||{})[k]};
const put=(s,k,v)=>{if(s==='D')ST.D[k]=v;else(ST.T[s]=ST.T[s]||{})[k]=v;save()};
const reg=()=>ST.D.gst==='Yes',rate=()=>(num(ST.D.rate)||10)/100;

/* ---------- builders ---------- */
function fld(s,k,t,o={}){const a=`data-s="${s}" data-k="${k}" id="i-${k}"`;
 if(t==='a')return`<textarea ${a} rows="1"></textarea>`;
 if(t==='d')return`<div><input type="date" ${a}><div class="dfm" id="c-${k}f"></div></div>`;
 if(t==='s')return`<select ${a}>${o.o.map(x=>`<option>${esc(x)}</option>`).join('')}</select>`;
 if(t==='m')return`<input class="m" inputmode="decimal" placeholder="$0.00" ${a}>`;
 if(t==='n')return`<input inputmode="decimal" ${a}>`;
 if(t==='c')return`<div class="cv" id="c-${k}"></div>`;
 return`<input type="text" ${a} ${o.ph?`placeholder="${esc(o.ph)}"`:''} ${o.auto?`autocomplete="${o.auto}"`:''}>`}
const row=(s,k,l,t,o={})=>`<div class="fr"${o.w?` id="${o.w}"`:''}><label for="i-${k}">${l}</label>${fld(s,k,t,o)}${o.ex?`<div class="ex">${esc(o.ex)}</div>`:''}</div>`;
const sec=t=>`<div class="sec">${t}</div>`;
const band=(t)=>`<div class="band"><b>${esc(ST.D.name||'Your Business Name')}</b><i>${t}</i></div><div class="sub">${['ABN '+(ST.D.abn||'00 000 000 000'),'Licence '+(ST.D.lic||'your licence no.'),ST.D.phone||'phone',ST.D.email||'email'].map(esc).join('   |   ')}</div>`;
function lines(s,withGst,head,n=8){let h=`<div class="ln th ${withGst?'':'ni'}"><span>#</span><span>${head[0]}</span><span>Qty</span><span>${head[1]}</span>${withGst?'<span>GST on item?</span>':''}<span>${head[2]}</span></div>`;
 for(let i=1;i<=n;i++)h+=`<div class="ln ${withGst?'':'ni'}"><span class="nn">${i}</span><input class="d" list="dl" placeholder="Description" data-s="${s}" data-k="d${i}"><input class="q" inputmode="decimal" placeholder="Qty" data-s="${s}" data-k="q${i}"><input class="p m" inputmode="decimal" placeholder="$0.00" data-s="${s}" data-k="p${i}">${withGst?`<select data-s="${s}" data-k="g${i}"><option>Yes</option><option>No</option></select>`:''}<div class="am" id="c-a${i}"></div></div>`;return h}
const tr=(l,id,cls='')=>`<div class="tr ${cls}"><span id="${id}l">${l}</span><span id="${id}"></span></div>`;
const payBlock=`${sec('PAYMENT DETAILS')}<div class="pay" id="c-pay1"></div><div class="pay" id="c-pay2"></div>`;
const DOCT=['Quote','Tax Invoice','Invoice','Variation'];
const btns=`<div class="btns"><button class="b" id="pv">Preview</button><button class="b o" id="pdf">Save as PDF</button><button class="b g" id="clr">Clear this document</button></div><div class="note">Preview and Save as PDF show the clean finished document, without the empty boxes. In the print window choose Save as PDF as the printer. Your work is saved on this device only.</div>`;

function view(){
 if(tab==='Start Here'){const st=[['1','Open My Details. Type your business name, ABN, trade, bank name, BSB and account number in the cream boxes. You only do this once.'],['2','Not sure if you charge GST? Pick Yes or No on My Details. Yes = use Tax Invoice. No = use Invoice. The page warns you if you pick the wrong tab.'],['3','Every new job: open Quote, Tax Invoice or Invoice and type over the cream boxes. The sums work themselves out. The Description box suggests common jobs for your trade. Type your own words any time.'],['4','Dates: pick them from the calendar. The due date is worked out for you.'],['5','Send it: tap Save as PDF at the bottom of the document, then Clear this document for the next job.'],['6','Customer wants to pay by card? Paste your card reader or payment link on My Details. Never write card numbers on a quote or invoice, and never ask for them by text or email.']];
  return`<div class="pg"><div class="band"><b>TRADIE PAPERWORK KIT</b></div><div class="sub">Start here. Set up in 3 minutes.</div>${sec('SET UP AND USE')}${st.map(x=>`<div class="st"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}${sec('WHICH TAB DO I USE?')}<div class="note">Quote: price a job before you start. Tax Invoice: registered for GST, use this to get paid. Invoice: not registered for GST, use this to get paid. Variation: customer wants extra work or something changes, get it approved first. Rate Calculator: work out your hourly rate and a fair markup on parts. Line Items: pick-list of common jobs for your trade. Worked Examples: see a finished quote and invoice.</div>${sec('WHAT THIS KIT FOLLOWS')}<div class="note">The Tax Invoice tab covers the 7 details the ATO lists for tax invoices, plus the extra buyer name or ABN for sales of $1,000 or more. Checked against the ATO "Tax invoices" page (ato.gov.au), last updated 18 September 2026. Not approved or endorsed by the ATO. Rules change, so check the ATO page for anything new.</div><div class="note">Your details stay on this device. Nothing you type is sent to anyone. Questions? Reply to your receipt email and I will answer within 24 hours.</div><div class="note">${FOOT}</div></div>`}
 if(tab==='My Details'){return`<div class="pg"><div class="band"><b>MY BUSINESS DETAILS</b></div><div class="sub">Fill this page in once. It appears on the Quote, Tax Invoice and Invoice tabs by itself.</div>
  ${sec('YOUR BUSINESS')}${row('D','name','Business name','t',{ex:'Smith Electrical',auto:'organization'})}${row('D','abn','ABN (11 digits)','t',{ex:'12 345 678 901'})}${row('D','lic','Licence no. (if you have one)','t',{ex:'EC12345'})}${row('D','phone','Phone','t',{ex:'0412 345 678',auto:'tel'})}${row('D','email','Email','t',{ex:'jo@smithelectrical.com.au',auto:'email'})}
  ${row('D','gst','Registered for GST?','s',{o:['Yes','No'],ex:'Many sole traders under $75,000 a year are not registered. Check the ATO.'})}${row('D','trade','Your trade','s',{o:['Electrician','Plumber','Other'],ex:'Decides which job suggestions show in the Description boxes.'})}${row('D','tradeo','Type your trade','t',{w:'w-tradeo',ex:'For example: carpenter, painter, landscaper. Shown on your Line Items tab.'})}
  ${sec('GETTING PAID')}${row('D','bank','Bank name','t',{ex:'Commonwealth Bank'})}${row('D','acct','Bank account name','t',{ex:'Smith Electrical'})}${row('D','bsb','BSB','t',{ex:'062-000'})}${row('D','acno','Account number','t',{ex:'12345678'})}${row('D','payid','PayID (optional)','t',{ex:'0412 345 678'})}${row('D','card','Card payment link (optional)','t',{ex:'Paste the payment link from your card reader or provider. Never type card numbers here or on an invoice.'})}${row('D','terms','Payment terms (days)','n',{ex:'7'})}${row('D','rate','GST rate (%)','n',{ex:'10% (Australian GST. Only change it if the law changes.)'})}
  <div class="note">The 10% rate is Australian GST. Your Registered for GST answer decides whether the Quote shows GST and which invoice tab to use: Tax Invoice if Yes, Invoice if No.</div><div class="note">${FOOT}</div></div>`}
 if(tab==='Variation'){const Y=true;return`<div class="pg">${band('VARIATION')}<div class="leg">Type in the cream boxes. Everything else works itself out. Get this approved BEFORE you do the extra work.</div>${sec('VARIATION DETAILS')}${row(tab,'no','Variation no.','t')}${row(tab,'date','Date','d')}${row(tab,'qno','Quote / job no.','t')}${row(tab,'days','Extra days','n')}${row(tab,'cust','Customer','t',{auto:'name'})}${row(tab,'site','Job site','t')}${row(tab,'why','Why the change?','s',{o:['Customer asked for it','Hidden problem found','Rule or compliance change','Material or supplier change','Other']})}${row(tab,'whyo','Describe the reason','t',{w:'w-whyo'})}${sec('WHAT IS CHANGING')}${row(tab,'desc','Describe the change','a')}<div style="height:8px"></div>${lines(tab,Y,['Description','Unit price (ex GST)','Amount (ex GST)'],4)}${tr('Subtotal (ex GST)','t1')}${tr('GST','t3')}${tr('THIS VARIATION (extra cost)','t4','big')}${sec('NEW CONTRACT TOTAL')}${row(tab,'orig','Original quote total','m',{ex:'Leave blank to use the total from your Quote tab. Type a figure if this job was quoted somewhere else.'})}${row(tab,'prev','Earlier approved variations on this job ($)','m')}${tr('This variation','v3')}${tr('NEW TOTAL','v4','big')}<div class="note">Working on a second variation? Put the earlier approved ones in the box above.</div>${row(tab,'pay','How it gets paid','t')}<div class="note">On domestic building work most states have strict rules for variations (written, signed, sometimes extra steps). Check your state regulator before you rely on this form. This is not legal advice.</div>${sec('CUSTOMER APPROVAL')}<div class="note" style="color:var(--navy);font-weight:700;font-size:13px">I approve this variation, the extra cost and any extra days shown above. The extra work starts after I approve.</div>${row(tab,'an','Name','t')}${row(tab,'as','Signature','t')}${row(tab,'ad','Date','d')}${btns}<div class="note">${FOOT}</div></div>`}
 if(tab==='Rate Calculator'){return`<div class="pg"><div class="band"><b>RATE AND MARKUP CALCULATOR</b></div><div class="leg">Work out what to charge so jobs actually pay. The cream boxes hold EXAMPLE numbers: type over them with yours. All prices are ex GST.</div>${sec('1. YOUR MINIMUM HOURLY RATE')}${row(tab,'wage','Wage you want before tax ($ a year)','m',{ex:'Example only. What you want to take home before tax. Ask your accountant how much to set aside for tax and super.'})}${row(tab,'costs','Business costs ($ a year)','m',{ex:'Example only. Vehicle, fuel, insurance, tools, phone, licence, accountant, software, training.'})}${row(tab,'weeks','Weeks you work a year','n',{ex:'Example only. Take out holidays, public holidays, sick days and quiet weeks.'})}${row(tab,'hrs','Chargeable hours a week','n',{ex:'Example only. Quoting, driving, buying parts and paperwork usually eat a big part of the week, so this is lower than hours worked.'})}${row(tab,'need','Money you need to bring in ($ a year)','c',{ex:'Wage plus business costs.'})}${row(tab,'hy','Chargeable hours a year','c',{ex:'Weeks times chargeable hours.'})}${tr('MINIMUM HOURLY RATE (ex GST)','rt','big')}<div class="note">Charge at least this. Less than this and you are working for less than you planned.</div>${row(tab,'rg','Same rate including GST','c',{ex:'Only adds GST if you said you are registered on My Details.'})}${sec('2. MATERIALS MARKUP')}${row(tab,'part','What you pay for the part ($)','m',{ex:'Example only. Your cost price, ex GST.'})}${row(tab,'mk','Markup you add (%)','n',{ex:'Example only. Markup is a percentage added ON TOP of what you paid.'})}${row(tab,'sp','Sell price (ex GST)','c',{ex:'What you charge the customer for the part.'})}${row(tab,'pf','Profit on the part ($)','c',{ex:'Sell price minus what you paid.'})}${row(tab,'mg','Margin (profit as % of sell price)','c',{ex:'Markup and margin are different. A 30% markup is only about a 23% margin.'})}${sec('3. WHAT EACH MARKUP REALLY EARNS')}${[10,15,20,25,30,40,50].map(m=>`<div class="tr" style="font-weight:400"><span>${m}% markup</span><span>${(m/(100+m)*100).toFixed(1)}% margin</span></div>`).join('')}<div class="note">If you want to keep a set margin on parts, check this table first. To keep a 25% margin you need a 33% markup, not 25%.</div><div class="note">A starting point only. Check what other trades near you charge and talk to your accountant. Numbers above are examples, not advice.</div><div class="note">${FOOT}</div></div>`}
 if(tab==='Line Items'){const T=ST.D.trade||'Electrician',TN=T==='Other'&&has(ST.D.tradeo)?ST.D.tradeo:T,it=LISTS[T].split('|'),un=UN[T].split(','),nt=NT[T]||{};return`<div class="pg"><div class="band"><b>${esc(TN.toUpperCase())} LINE ITEMS</b></div><div class="leg">Tap a Description box on the Quote, Tax Invoice, Invoice or Variation tab to pick from this list, or just type your own words. Prices are blank on purpose: set your own. To change this list, change "Your trade" on My Details.</div>${sec('COMMON LINE ITEMS')}${it.map((d,i)=>`<div class="tr" style="font-weight:400;border-bottom:1px solid var(--line)"><span>${esc(d)}${nt[i]?`<br><small style="color:var(--mut)">${esc(nt[i])}</small>`:''}</span><span style="color:var(--mut)">${un[i]}</span></div>`).join('')}${sec('SUGGESTED EXCLUSIONS (copy what applies into the Exclusions box on your Quote)')}${EX[T].split('|').map(x=>`<div class="note" style="color:#1f2937;font-size:13px">&bull; ${esc(x)}</div>`).join('')}<div class="note">Starter wording only. Change it to suit your trade, your state and each job.</div><div class="note">${FOOT}</div></div>`}
 if(tab==='Worked Examples'){const ln=(a,b)=>`<div class="tr" style="font-weight:400;border-bottom:1px solid var(--line)"><span>${a}</span><span>${b}</span></div>`;return`<div class="pg"><div class="band"><b>WORKED EXAMPLES</b></div><div class="leg">EXAMPLES ONLY. The names and figures are made up to show what a finished quote and invoice look like. Set your own rates.</div>${sec('EXAMPLE A: SPARKY QUOTE (Q-001)')}<div class="note" style="color:#1f2937">Replace 6 downlights in living room. Prices exclude GST.</div>${ln('1. Labour (hours) &nbsp; 3 &times; $95.00 &nbsp; GST: Yes','$285.00')}${ln('2. LED downlights &nbsp; 6 &times; $30.00 &nbsp; GST: Yes','$180.00')}${tr('Subtotal (ex GST)','x1').replace('<span id="x1"></span>','<span>$465.00</span>')}${tr('GST (10%)','x2').replace('<span id="x2"></span>','<span>$46.50</span>')}<div class="tr big"><span>TOTAL</span><span>$511.50</span></div><div class="note">No deposit for a job this size. Balance due on completion. Exclusions: plastering and painting.</div>${sec('EXAMPLE B: PLUMBER TAX INVOICE (INV-014)')}<div class="note" style="color:#1f2937">Replace kitchen mixer tap. Bill to: A. Customer.</div>${ln('1. Labour (hours) &nbsp; 1.5 &times; $110.00 &nbsp; GST: Yes','$165.00')}${ln('2. Mixer tap supplied &nbsp; 1 &times; $120.00 &nbsp; GST: Yes','$120.00')}<div class="tr"><span>Subtotal (ex GST)</span><span>$285.00</span></div><div class="tr"><span>GST (10%)</span><span>$28.50</span></div><div class="tr big"><span>TOTAL PAYABLE (incl GST)</span><span>$313.50</span></div><div class="note">Total price includes GST of $28.50. Payment due within 7 days.</div><div class="note">To make your own: open the Quote, Tax Invoice or Invoice tab and type in the cream boxes. Tap Clear this document when you are ready for the next job.</div><div class="note">${FOOT}</div></div>`}
 const q=tab==='Quote',ti=tab==='Tax Invoice',title=q?'QUOTE':ti?'TAX INVOICE':'INVOICE';
 let h=`<div class="pg">${band(title)}<div class="leg" id="leg"></div>${sec(q?'QUOTE DETAILS':'INVOICE DETAILS')}`;
 h+=row(tab,'no',q?'Quote no.':'Invoice no.','t')+row(tab,'date',q?'Date':'Issue date','d')+row(tab,'cust',q?'Customer':'Bill to','t',{auto:'name'});
 h+=q?row(tab,'valid','Valid until','c')+row(tab,'phone','Phone / email','t'):row(tab,'due','Due date','c');
 if(ti)h+=row(tab,'cabn','Customer ABN','t');
 h+=row(tab,'addr','Address','t')+row(tab,'site',q?'Job site':'Job address','t');
 if(ti)h+='<div class="warn" id="req"></div>';
 if(q)h+=sec('SCOPE AND PRICE')+row(tab,'scope','Scope of work','a')+row(tab,'ptype','Price type','s',{o:['Fixed price','Estimate (final price based on actual hours and materials)']});
 h+='<div style="height:8px"></div>'+lines(tab,tab!=='Invoice',['Description',q?'Unit price (ex GST)':ti?'Price (ex GST)':'Unit price',q||ti?'Amount (ex GST)':'Amount']);
 if(tab==='Invoice')h+=tr('TOTAL PAYABLE','t4','big')+'<div class="note">GST not applicable. Supplier is not registered for GST.</div>';
 else h+=tr('Subtotal (ex GST)','t1')+tr('GST','t3')+tr(ti?'TOTAL PAYABLE (incl GST)':'TOTAL','t4','big')+'<div class="note" id="c-gn"></div>';
 if(q)h+=sec('TERMS')+row(tab,'incl','Inclusions','a')+row(tab,'excl','Exclusions','a')+row(tab,'dep','Deposit (%)','n')+'<div class="note" id="c-dn"></div>'+row(tab,'bal','Balance due','t')+row(tab,'fee','Quote fee ($)','m')+'<div class="note">Optional. If you charge a quote fee, say it is credited back if the customer goes ahead.</div>';
 h+=payBlock;
 if(q)h+='<div class="note">Variations: any change to the scope of work will be quoted and agreed in writing before the work starts.</div>'+sec('ACCEPTANCE')+'<div class="note"><b>I accept this quote.</b></div>'+row(tab,'an','Name','t')+row(tab,'as','Signature','t')+row(tab,'ad','Date','d');
 else h+=`<div class="pay" id="c-terms"></div>`;
 return h+`${btns}<div class="note">${FOOT}</div></div>`}

/* ---------- live sums and messages ---------- */
const set=(id,t)=>{const e=$('#'+id);if(e)e.textContent=t};
function lc(s,n,show,dom=true){let sub=0,tax=0;for(let i=1;i<=n;i++){const a=has(get(s,'q'+i))&&has(get(s,'p'+i)),v=a?r2(num(get(s,'q'+i))*num(get(s,'p'+i))):0;sub+=v;if(a&&get(s,'g'+i)!=='No')tax+=v;const e=dom&&$('#c-a'+i);if(e){e.textContent=a?usd(v):'';e.parentElement.classList.toggle('empty',![get(s,'d'+i),get(s,'q'+i),get(s,'p'+i)].some(has))}}sub=r2(sub);const g=show?r2(tax*rate()):0;return{sub,g,tot:r2(sub+g)}}
const dates=s=>$$('[id^="c-"][id$="f"]').forEach(e=>{e.textContent=fmtD(get(s,e.id.slice(2,-1)))});
const gl=R=>R?'GST ('+Math.round(rate()*100)+'%)':'GST (not registered, none charged)';
function dc(){const D=ST.D,s=tab,q=s==='Quote',ti=s==='Tax Invoice',R=reg(),show=ti||(q&&R),v=lc(s,8,show),tot=v.tot,no=get(s,'no')||'',dt=get(s,'date');
 set('t1',usd(v.sub));set('t3',show?usd(v.g):'');set('t3l',gl(show));set('t4',usd(tot));dates(s);set('c-valid',addD(dt,30));set('c-due',addD(dt,num(D.terms)));
 let leg='Type in the cream boxes. Everything else works itself out.',bad=false;
 if(ti&&!R){leg='STOP: you are not registered for GST. Use the Invoice tab, not this one.';bad=true}
 if(s==='Invoice'&&R){leg='STOP: you are registered for GST. Use the Tax Invoice tab, not this one.';bad=true}
 const L=$('#leg');if(L){L.textContent=leg;L.className='leg'+(bad?' bad':'')}
 set('req',ti&&tot>=1000&&!has(get(s,'cust'))&&!has(get(s,'cabn'))?'REQUIRED: add the customer name or ABN. The ATO needs it when the total is $1,000 or more including GST.':'');
 if(ti){const f=[1,2,3,4,5,6,7,8].some(i=>get(s,'g'+i)==='No'&&has(get(s,'q'+i))&&has(get(s,'p'+i))&&num(get(s,'q'+i))*num(get(s,'p'+i))>0);set('c-gn',f?'GST amount is shown above. Items marked No are GST-free.':'Total price includes GST of '+usd(v.g))}
 if(q){set('c-gn',R?'All prices exclude GST. GST is added to items marked Yes.':'Not registered for GST. No GST charged.');
  let dp=num(get(s,'dep'));if(dp>1)dp/=100;set('c-dn',has(get(s,'dep'))?'Deposit due: '+usd(r2(tot*dp))+". Check your regulator's current deposit limit for building work before you ask for it.":"Deposits on building work are capped in most states, and the cap depends on the contract value. Check your regulator's current limit before you set a percentage.")}
 $('#c-pay1').innerHTML=`<b>Bank:</b> ${esc(D.bank)}   |   <b>Account name:</b> ${esc(D.acct)}   |   <b>BSB</b> ${esc(D.bsb)}   |   <b>Account no.</b> ${esc(D.acno)}`;
 $('#c-pay2').textContent=(has(D.payid)?'PayID: '+D.payid+'   |   ':'')+(has(D.card)?'Pay by card: '+D.card+'   |   ':'')+'Reference: '+no;
 set('c-terms','Payment due within '+(D.terms||'')+' days of the invoice date.')}
function vc(){const s='Variation',R=reg(),v=lc(s,4,R),qt=lc('Quote',8,R,false).tot,o=has(get(s,'orig'))?num(get(s,'orig')):qt;
 set('t1',usd(v.sub));set('t3',R?usd(v.g):'');set('t3l',gl(R));set('t4',usd(v.tot));dates(s);set('v3',usd(v.tot));set('v4',usd(r2(o+num(get(s,'prev'))+v.tot)));const e=$('#i-orig');if(e)e.placeholder=usd(qt)}
function rc(){const s='Rate Calculator',need=num(get(s,'wage'))+num(get(s,'costs')),hy=num(get(s,'weeks'))*num(get(s,'hrs')),rt=hy>0?r2(need/hy):0;
 set('c-need',usd(need));set('c-hy',hy.toLocaleString('en-AU'));set('rt',usd(rt));set('c-rg',usd(reg()?r2(rt*(1+rate())):rt));
 const p=num(get(s,'part')),sp=r2(p*(1+num(get(s,'mk'))/100)),pf=r2(sp-p);set('c-sp',usd(sp));set('c-pf',usd(pf));set('c-mg',(sp>0?pf/sp*100:0).toFixed(1)+'%')}
function pp(){const s=tab,P=$('#paper');if(!P)return;const D=ST.D,g=k=>get(s,k),q=s==='Quote',ti=s==='Tax Invoice',vr=s==='Variation',R=reg(),show=ti||((q||vr)&&R),n=vr?4:8,v=lc(s,n,show,false);
 const T={Quote:'QUOTE','Tax Invoice':'TAX INVOICE',Invoice:'INVOICE',Variation:'VARIATION'}[s],dt=g('date');
 const ln=(l,x)=>has(x)?`<p><b>${l}:</b> ${esc(x).replace(/\n/g,'<br>')}</p>`:'';
 const meta=[[(vr?'Variation':q?'Quote':'Invoice')+' no.',g('no')],['Date',fmtD(dt)],q?['Valid until',addD(dt,30)]:vr?['Quote / job no.',g('qno')]:['Due date',addD(dt,num(D.terms))],vr&&has(g('days'))?['Extra days',g('days')]:[]].filter(m=>has(m[1])).map(m=>`<b>${m[0]}:</b> ${esc(m[1])}`).join(' &nbsp;|&nbsp; ');
 let rows='';for(let i=1;i<=n;i++){const a=has(g('q'+i))&&has(g('p'+i));if(!a&&!has(g('d'+i)))continue;rows+=`<tr><td>${esc(g('d'+i))}</td><td class="n">${esc(g('q'+i))}</td><td class="n">${a?usd(num(g('p'+i))):''}</td>${show?`<td>${g('g'+i)==='No'?'No':'Yes'}</td>`:''}<td class="n">${a?usd(r2(num(g('q'+i))*num(g('p'+i)))):''}</td></tr>`}
 const tt=(l,x,b)=>`<div class="tr ${b||''}"><span>${l}</span><span>${x}</span></div>`;
 let h=`<div class="band"><b>${esc(D.name||'Your Business Name')}</b><i>${T}</i></div><div class="sub">${[D.abn&&'ABN '+D.abn,D.lic&&'Licence '+D.lic,D.phone,D.email].filter(has).map(esc).join('   |   ')}</div>`;
 h+=`<p style="margin-top:10px">${meta}</p>`+ln(ti?'Bill to':q?'Prepared for':'Customer',(g('cust')||'')+(has(g('cabn'))?' (ABN '+g('cabn')+')':''))+ln('Phone / email',g('phone'))+ln('Address',g('addr'))+ln(q||vr?'Job site':'Job address',g('site'));
 if(q){h+=ln('Scope of work',g('scope'))+ln('Price type',g('ptype')||'Fixed price')}if(vr)h+=ln('Why the change',g('why')==='Other'&&has(g('whyo'))?g('whyo'):(g('why')||'Customer asked for it'))+ln('What is changing',g('desc'));
 if(rows)h+=`<table><tr><th>Description</th><th class="n">Qty</th><th class="n">${q||vr?'Unit price':'Price'}${show?' (ex GST)':''}</th>${show?'<th>GST?</th>':''}<th class="n">Amount${show?' (ex GST)':''}</th></tr>${rows}</table>`;
 h+=tt('Subtotal'+(show?' (ex GST)':''),usd(v.sub))+(show?tt(gl(show),usd(v.g)):'')+tt(vr?'THIS VARIATION'+(show?' (incl GST)':''):ti?'TOTAL PAYABLE (incl GST)':q?'TOTAL'+(show?' (incl GST)':''):'TOTAL PAYABLE',usd(v.tot),'big');
 if(ti){const f=[1,2,3,4,5,6,7,8].some(i=>g('g'+i)==='No'&&has(g('q'+i))&&has(g('p'+i)));h+=`<p class="sm">${f?'GST amount is shown above. Items marked No are GST-free.':'Total price includes GST of '+usd(v.g)}</p>`}
 if(q)h+=`<p class="sm">${R?'All prices exclude GST. GST is added to items marked Yes.':'Not registered for GST. No GST charged.'}</p>`;
 if(s==='Invoice')h+='<p class="sm">GST not applicable. Supplier is not registered for GST.</p>';
 if(q){let dp=num(g('dep'));if(dp>1)dp/=100;h+=ln('Inclusions',g('incl'))+ln('Exclusions',g('excl'))+(has(g('dep'))?`<p><b>Deposit:</b> ${usd(r2(v.tot*dp))} due on acceptance.${has(g('bal'))?' <b>Balance:</b> '+esc(g('bal'))+'.':''}</p>`:ln('Balance due',g('bal')))+(has(g('fee'))?`<p><b>Quote fee:</b> ${esc(g('fee'))}</p>`:'')}
 if(vr){const qt=lc('Quote',8,R,false).tot,o=has(g('orig'))?num(g('orig')):qt;h+=tt('Original quote total',usd(o))+tt('Earlier approved variations',usd(num(g('prev'))))+tt('This variation',usd(v.tot))+tt('NEW TOTAL',usd(r2(o+num(g('prev'))+v.tot)),'big')+ln('How it gets paid',g('pay'))}
 if(!vr&&(has(D.bank)||has(D.acno)))h+=`<p style="margin-top:10px"><b>Payment details</b></p><p><b>Bank:</b> ${esc(D.bank)} &nbsp;|&nbsp; <b>Account name:</b> ${esc(D.acct)} &nbsp;|&nbsp; <b>BSB:</b> ${esc(D.bsb)} &nbsp;|&nbsp; <b>Account no.:</b> ${esc(D.acno)}</p><p>${[has(D.payid)&&'PayID: '+esc(D.payid),has(D.card)&&'Pay by card: '+esc(D.card),'Reference: '+esc(g('no')||'')].filter(Boolean).join(' &nbsp;|&nbsp; ')}</p>`;
 if(ti||s==='Invoice')h+=`<p>Payment due within ${esc(D.terms||'')} days of the invoice date.</p>`;
 if(q)h+='<p class="sm">Variations: any change to the scope of work will be quoted and agreed in writing before the work starts.</p>';
 if(q||vr){const f=k=>has(g(k))?(k==='ad'?fmtD(g(k)):esc(g(k))):'&nbsp;';h+=`<p style="margin-top:14px"><b>${vr?'I approve this variation, the extra cost and any extra days shown above. The extra work starts after I approve.':'I accept this quote.'}</b></p><div class="sg"><div>Name: ${f('an')}</div><div>Signature: ${f('as')}</div><div>Date: ${f('ad')}</div></div>`}
 P.innerHTML=h+`<p class="sm" style="margin-top:14px">${FOOT}</p>`}
function calc(){if(tab==='Variation'){vc();pp()}else if(tab==='Rate Calculator')rc();else if($('#c-pay1')){dc();pp()}}

/* ---------- wiring ---------- */
const mf=e=>{if(e.classList.contains('m')&&has(e.value))e.value=usd(num(e.value))};
function fill(){$$('[data-k]').forEach(e=>{const v=get(e.dataset.s,e.dataset.k);if(v!=null)e.value=v;else if(e.tagName==='SELECT'&&e.dataset.s!=='D')e.value='Yes';mf(e);if(e.tagName==='TEXTAREA')grow(e)})}
function vis(){const a=$('#w-tradeo'),b=$('#w-whyo');if(a)a.style.display=ST.D.trade==='Other'?'':'none';if(b)b.style.display=get('Variation','why')==='Other'?'':'none'}
const grow=e=>{e.style.height='auto';e.style.height=e.scrollHeight+'px'};
const setList=()=>{$('#dl').innerHTML=LISTS[ST.D.trade].split('|').map(x=>`<option value="${esc(x)}">`).join('')};
function go(t){tab=t;document.body.classList.remove('pv');document.body.classList.toggle('hasp',DOCT.includes(t));$('#nav').innerHTML=TABS.map(x=>`<button role="tab" aria-selected="${x===t}" data-t="${x}">${x}</button>`).join('');$('#m').innerHTML=view()+(DOCT.includes(t)?'<div class="pbar"><button class="b g" id="bk">Back to editing</button><button class="b o" id="pdf2">Save as PDF</button></div><div id="paper"></div>':'');fill();vis();calc();setList();scrollTo(0,0)}
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.t)};
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset.k)return;put(t.dataset.s,t.dataset.k,t.value);if(t.tagName==='TEXTAREA')grow(t);if(t.dataset.k==='trade')setList();vis();calc()});
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset.k)return;if(t.dataset.k==='trade')setList();vis();calc()});
document.addEventListener('focusin',e=>{const t=e.target;if(t.classList&&t.classList.contains('m')&&has(t.value)){t.value=num(t.value)||'';t.select&&t.select()}});
document.addEventListener('focusout',e=>{const t=e.target;if(t.classList&&t.classList.contains('m')){put(t.dataset.s,t.dataset.k,t.value);mf(t);put(t.dataset.s,t.dataset.k,t.value);calc()}});
document.addEventListener('click',e=>{const t=e.target;
 if(t.id==='pv'){document.body.classList.add('pv');scrollTo(0,0)}if(t.id==='bk')document.body.classList.remove('pv');
 if(t.id==='pdf'||t.id==='pdf2'){const o=document.title;document.title=`${tab} ${get(tab,'no')||''} ${ST.D.name||''}`.trim();window.print();document.title=o}
 if(t.id==='clr'&&confirm('Clear this document? Your business details stay.')){ST.T[tab]={};save();go(tab)}});
go('Start Here');
TK_EOF
git add -A
git commit -m "Update Lite web app" || echo "No changes to commit."
git push
echo "Done. Wait about 2 minutes, then refresh your site."
