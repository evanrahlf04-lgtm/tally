import {$,esc,peso,MN,MF,ic} from '../util.js';
import {now,cur,q,ft,fc,tl,S,isCur,isPast,cat,calc,budgetOf,PAGE,isBalance,incWord,range,setRange,rangeBounds} from '../state.js';
import {tone,money,topbar,tally,monHtml} from '../ui.js';
import {monthOcc,overdue,upcoming,label,dateTxt,mkey} from '../bills.js';
import {budgetAlerts} from '../alerts.js';
import {spendCard,earnCard,goalCard,insights,balSwitch} from '../dash.js';
const dayLbl=d=>{const t0=new Date(),y0=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()-1),k=d.toDateString();return k===t0.toDateString()?'Today':k===y0.toDateString()?'Yesterday':d.getDate()+' '+MN[d.getMonth()]+(d.getFullYear()!==t0.getFullYear()?' '+d.getFullYear():'')};
// Transaction rows grouped under a day label, the same on Overview and on the history screen.
function rowsHtml(list){let last='';return list.map(t=>{const c=cat(t.catId),inc=t.type==='income',d=new Date(t.date+'T00:00'),k=d.toDateString(),dl=k!==last?(last=k,'<div class="dh"><span>'+dayLbl(d)+'</span></div>'):'';
 return dl+`<button class="tr" data-edit="${t.id}">${inc?tone(68,'in'):tone(c.hue,c.icon)}<div class="m"><b>${esc(t.note||c.name)}</b><span><i class="ns">${inc?'Income':'Expense'}</i><i class="os">${inc?'Income':esc(c.name)}</i></span></div>${inc?'<span class="badge" style="justify-self:start">Income</span>':`<span class="cp tone" style="--h:${c.hue}">${esc(c.name)}</span>`}<div class="dt">${d.getDate()} ${MN[d.getMonth()]} ${d.getFullYear()}</div><div class="am ${inc?'in':''}">${inc?'+':'−'}${peso(t.amount)}<small class="os">${inc?'Income':'Expense'}</small></div><span class="go">${ic('edit','sm')}</span></button>`}).join('')}
const byDate=(a,b)=>b.date.localeCompare(a.date);
// Preset windows for the history screen. 'month' tracks the month picker; the rest are fixed, relative to today.
const RANGES=[['month','This month'],['today','Today'],['yesterday','Yesterday'],['week','Last 7 days'],['3m','Last 3 months'],['year','This year'],['all','All time']];
function txPart(){const[from,to]=rangeBounds(),src=range==='month'?calc().tx:S.tx.filter(t=>t.date>=from&&t.date<=to);
 const list=src.filter(t=>(ft==='all'||t.type===ft)&&(fc==='all'||t.catId===fc)&&(!q||(t.note+' '+cat(t.catId).name).toLowerCase().includes(q.toLowerCase()))).sort(byDate);
 const rows=rowsHtml(list.slice(0,tl));
 const empty=range==='month'?'No transactions in '+MF[cur.m]+' yet.':'No transactions in this period.';
 return{count:list.length,html:(rows||`<div class="empty">${ic('wallet','lg')}${S.tx.length?'No matches.':empty}</div>`)+(list.length>tl?`<button class="btn g more" data-act="more">Show ${Math.min(PAGE(),list.length-tl)} more</button>`:'')}}
// The full list with search and filter chips, opened from "View all" on Overview.
// The subtitle text for whichever period is picked ("November 2026", "This year", ...).
const rangeSub=()=>range==='month'?`${MF[cur.m]} ${cur.y}`:RANGES.find(r=>r[0]===range)[1];
function history(){const tp=txPart(),key=fc!=='all'?'c:'+fc:ft;
 const chips=[['all','All'],['expense','Expenses'],['income','Income'],...S.cats.map(c=>['c:'+c.id,c.name])];
 const sub=rangeSub();
 return `<div class="top hist"><button class="hb" data-v2="home" aria-label="Back to Overview">${ic('l')}</button><div class="tt"><h1 class="serif">Transaction history</h1><small>${sub} · <span id="tcount">${tp.count} total</span></small></div><button class="hb" id="hsearch" aria-label="Search">${ic('search')}</button>${range==='month'?monHtml():''}</div>
 <div class="hsrch" ${q?'':'hidden'}><label class="pill s">${ic('search','sm')}<input id="q" placeholder="Search notes or categories" value="${esc(q)}"></label></div>
 <div class="chips" id="rngc">${RANGES.map(r=>`<button type="button" data-rng="${r[0]}" class="${range===r[0]?'on':''}">${r[1]}</button>`).join('')}</div>
 <div class="chips" id="ftc">${chips.map(o=>`<button type="button" data-ftc="${o[0]}" class="${key===o[0]?'on':''}">${esc(o[1])}</button>`).join('')}</div>
 <section class="panel fade" data-nojump><div class="th"><span></span><span>Transaction</span><span>Category</span><span>Date</span><span>Amount</span><span></span></div><div id="txlist">${tp.html}</div></section>`}
// Shows the top budget alerts for this month on Overview.
function budgetBar(){if(!isCur())return '';const a=budgetAlerts(now.getFullYear(),now.getMonth());if(!a.length)return '';const over=a.filter(x=>x.lvl==='over').length;
 return `<section class="panel fade alertbar" data-nojump><div class="hrow" style="align-items:center"><div style="display:flex;gap:12px;align-items:center"><span class="tone ico" style="--h:${over?356:38}">${ic('alert')}</span><div><b>${a.length} budget alert${a.length>1?'s':''}${over?`, ${over} over`:''}</b><p class="sub" style="margin-top:2px">${a.slice(0,2).map(x=>esc(x.t)).join(' · ')}${a.length>2?' · and more':''}</p></div></div><button class="btn sm" data-v2="budgets">Review budgets</button></div></section>`}
function home(){const s=calc(),bs=balSwitch(s.left);
 const key=mkey(cur.y,cur.m),od=overdue(),bills=[...(isCur()?od.filter(o=>o.key!==key):[]),...monthOcc(cur.y,cur.m)].sort((a,b)=>(+(a.st==='paid')-+(b.st==='paid'))||a.date.localeCompare(b.date)),soon=upcoming(3);
 const nOd=od.reduce((a,o)=>a+o.rem,0),alertBar=isCur()&&(od.length||soon.length)?`<section class="panel fade alertbar" data-nojump><div class="hrow" style="align-items:center"><div style="display:flex;gap:12px;align-items:center"><span class="tone ico" style="--h:356">${ic('alert')}</span><div><b>${od.length?`${od.length} bill${od.length>1?'s':''} overdue, ${peso(nOd)}`:''}${od.length&&soon.length?' · ':''}${soon.length?`${soon.length} due in the next 3 days`:''}</b><p class="sub" style="margin-top:2px">${[...od,...soon].slice(0,3).map(o=>esc(o.b.name)).join(', ')}${od.length+soon.length>3?' and more':''}</p></div></div><button class="btn sm" data-v2="bills">Review payables</button></div></section>`:'';
 const paidN=bills.filter(o=>o.st==='paid').length;
 const welcome=!S.income&&!S.start.amount&&!S.tx.length&&!S.pay.length?`<section class="panel fade dwide" data-nojump><div class="hrow" style="align-items:center"><div><h2 style="font-size:20px">Welcome to Tally</h2><p class="sub" style="margin-top:4px">How much money are you starting with? Enter a starting amount, or use your salary as your base. Then give each category a budget and log your first expense.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="income">Set starting amount</button><button class="btn g" data-act="usesalary">Use my salary instead</button></div></div></section>`:'';
 return topbar('Overview',`${MF[cur.m]} ${cur.y}${isCur()?` · day ${s.day} of ${s.dm}`:''}`)+`<div class="dash fade">${welcome}
 <section class="panel dcard dbal" data-sec="Balance"><div class="dbt">${bs.chips}<span class="mute">${isCur()?`Day ${s.day} of ${s.dm}`:MF[cur.m]+' '+cur.y}</span></div>
  <div class="lab">${isBalance()?(isCur()?'Your balance':'Balance at month end'):'Left this month'}</div>${bs.conv?`<div class="bal serif">${bs.conv.val}</div><span class="dpill" title="${bs.conv.at||''}">≈ ${peso(s.left)} · ${bs.conv.note}</span>`:`<div class="bal serif" data-count="${s.left}">${money(s.left)}</div>`}
  ${isCur()?`<button class="dpill" data-v2="budgets">You can spend <b>${peso(Math.max(0,s.free))}</b> a day${ic('r','sm')}</button>`:`<span class="dpill">Spent ${peso(s.spent)} of ${peso(s.income)}</span>`}
  <div class="dact"><button class="dbtn p" data-act="add" data-ty="expense">${ic('minus','sm')}Expense</button><button class="dbtn" data-act="add" data-ty="income">${ic('plus','sm')}Income</button><button class="dgo" data-v2="report" aria-label="Open report">${ic('r')}</button></div>
  <div class="dmeta"><button data-act="income" aria-label="Edit starting amount or salary">${incWord()} <b>${peso(s.income)}</b>${ic('edit','sm')}</button>${isBalance()?`<span>Money in <b>${peso(s.inflow)}</b></span>`:''}<span>${isCur()?'On pace for':'Spent'} <b>${peso(s.proj)}</b></span></div></section>
 ${goalCard()}
 ${alertBar}${budgetBar()}
 ${insights()}
 ${spendCard()}
 ${earnCard()}
 <section class="panel dcard dtx fade" data-sec="Transactions"><div class="dh2"><span class="dic">${ic('in')}</span><h2>Transactions</h2><button class="va" data-v2="history">View all${ic('r','sm')}</button></div><div id="htx">${rowsHtml(s.tx.slice().sort(byDate).slice(0,5))||`<div class="empty">${ic('wallet','lg')}No transactions in ${MF[cur.m]} yet.</div>`}</div></section>
 <section class="panel dcard dbills" data-sec="Bills"><div class="dh2"><span class="dic">${ic('cal')}</span><h2>Bills this month</h2><div class="scs">${tally(paidN,bills.length,paidN+' of '+bills.length+' bills paid')}<button class="scb" data-sc="-1" aria-label="Scroll bills left">${ic('l','sm')}</button><button class="scb" data-sc="1" aria-label="Scroll bills right">${ic('r','sm')}</button></div></div><div class="tpls">${bills.map(o=>{const c=cat(o.b.catId),late=o.st==='late';return `<button class="tpl ${o.st==='paid'?'done':''}" style="--h:${c.hue}" data-pay="${o.b.id}|${o.key}"><div class="t">${tone(c.hue,c.icon)}<div style="min-width:0"><b>${esc(o.b.name)}</b><span class="st ${late?'late':''}">${ic(o.st==='paid'?'check':late?'alert':'cal','sm')}${label(o)}</span></div></div><div class="f"><span>${dateTxt(o.date)}</span><b>${peso(o.rem>0?o.rem:o.amt)}</b></div></button>`}).join('')}<button class="tpl tnew" data-act="addbill">${ic('plus','lg')}<span>New bill</span></button></div></section>
 </div>`}
export {home,txPart,history,rangeSub};

