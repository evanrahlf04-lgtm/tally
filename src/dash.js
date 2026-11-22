import {esc,peso,MN,MF,ic} from './util.js';
import {S,cur,now,mk,calc,cat,baseIncome,isBalance,isCur,budgetOf} from './state.js';
import {KINDS} from './pay.js';
import {monthOcc,upcoming} from './bills.js';
import {budgetAlerts} from './alerts.js';

// Dashboard cards for Overview: spending by category, earnings by source, goals, and insights from the data.
const prevOf=(y,m)=>m?{y,m:m-1}:{y:y-1,m:11};
const pctCh=(a,b)=>b>0?Math.round((a-b)/b*1000)/10:null;
const chg=v=>v==null?'':`<span class="dch ${v>0?'up':'dn'}">${v>0?'+':'−'}${Math.abs(v)}%</span>`;
const head=(icn,t,right='')=>`<div class="dh2"><span class="dic">${ic(icn)}</span><h2>${t}</h2>${right}</div>`;

// Spending per category for a month, up to a given day (so a month in progress compares fairly with last month).
function spendBy(y,m,upto=31){const k=mk(y,m),by={};let tot=0;S.tx.forEach(t=>{if(t.type!=='income'&&t.date.startsWith(k)&&+t.date.slice(8,10)<=upto){by[t.catId]=(by[t.catId]||0)+t.amount;tot+=t.amount}});return{by,tot}}

function spendCard(){
 const s=calc(),p=prevOf(cur.y,cur.m),day=isCur()?now.getDate():31,last=spendBy(p.y,p.m,day),ch=pctCh(s.spent,last.tot);
 const cats=S.cats.filter(c=>s.by[c.id]>0).sort((a,b)=>s.by[b.id]-s.by[a.id]);
 const top=cats.slice(0,4),rest=cats.slice(4).reduce((a,c)=>a+s.by[c.id],0);
 const segs=[...top.map(c=>({n:c.name,v:s.by[c.id]})),...(rest>0?[{n:'Everything else',v:rest}]:[])];
 const cols=['var(--chart1)','var(--chart2)','var(--chart3)','var(--chart4)','var(--chart5)'];
 const R=52,C=2*Math.PI*R,gap=segs.length>1?4:0;let off=0;
 const arcs=segs.map((g,i)=>{const len=Math.max(0,g.v/s.spent*C-gap),a=`<circle r="${R}" cx="64" cy="64" fill="none" stroke="${cols[i]}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 64 64)"/>`;off+=g.v/s.spent*C;return a}).join('');
 // The category that grew most against the same days last month.
 const up=top.map(c=>({c,v:pctCh(s.by[c.id],last.by[c.id]||0)})).filter(x=>x.v!=null&&x.v>=5).sort((a,b)=>b.v-a.v)[0];
 return `<section class="panel dcard dspend" data-sec="Spending">${head('cart','Spending',`<span class="dmo">${MN[cur.m]}</span>`)}
 ${s.spent>0?`<div class="donut"><svg viewBox="0 0 128 128" role="img" aria-label="Spending by category">${segs.length?`<circle r="${R}" cx="64" cy="64" fill="none" stroke="var(--barmute)" stroke-width="14"/>${arcs}`:''}</svg><div class="dc"><b>${peso(s.spent)}</b>${chg(ch)}</div></div>
 ${up?`<p class="dnote">${ic('chart','sm')}${esc(up.c.name)} spending is up <b>${up.v}%</b></p>`:ch!=null&&ch<0?`<p class="dnote">${ic('check','sm')}You spent <b>${Math.abs(ch)}%</b> less than this time last month</p>`:''}
 <div class="dleg">${segs.map((g,i)=>`<span><i style="background:${cols[i]}"></i><em>${esc(g.n)}</em><b>${peso(g.v)}</b></span>`).join('')}</div>`
 :`<div class="empty">${ic('cart','lg')}No spending in ${MF[cur.m]} yet.</div>`}</section>`}

// Money that came in during a month, grouped by where it came from.
function earnings(y,m){const k=mk(y,m),src={};const add=(n,v)=>{if(v>0)src[n]=(src[n]||0)+v};
 S.pay.forEach(p=>{if(p.paid&&p.date.startsWith(k))add((KINDS[p.kind]||KINDS.other)[0],p.net)});
 S.tx.forEach(t=>{if(t.type==='income'&&t.date.startsWith(k))add('Other income',t.amount)});
 if(!isBalance()&&!src.Salary)add(S.base==='salary'?'Salary':'Monthly income',baseIncome(y,m));
 return src}
function earnCard(){
 const src=earnings(cur.y,cur.m),p=prevOf(cur.y,cur.m),prev=Object.values(earnings(p.y,p.m)).reduce((a,v)=>a+v,0);
 const rows=Object.entries(src).sort((a,b)=>b[1]-a[1]),tot=rows.reduce((a,r)=>a+r[1],0),mx=rows.length?rows[0][1]:1,ch=pctCh(tot,prev);
 return `<section class="panel dcard dearn" data-sec="Earnings">${head('wallet','Earnings',`<button class="dmo" data-v2="tax">Pay log</button>`)}
 <div class="dbig">${peso(tot)}</div><p class="dsub">${ch==null?'This month':`${chg(ch)} vs last month`}</p>
 ${rows.length?`<div class="dbars">${rows.slice(0,5).map((r,i)=>`<div class="dbr ${i?'':'lead'}"><div class="dbl"><span>${esc(r[0])}</span><b>${peso(r[1])}</b></div><div class="dbtr"><i style="width:${Math.max(4,r[1]/mx*100)}%">${!i&&tot?`<em>${Math.round(r[1]/tot*100)}%</em>`:''}</i></div></div>`).join('')}</div>`
 :`<p class="note">Log your pay or add income to see where your money comes from.</p>`}</section>`}

function goalCard(){
 const gs=S.goals,saved=gs.reduce((a,g)=>a+g.saved,0),target=gs.reduce((a,g)=>a+g.target,0),pc=target?Math.round(saved/target*100):0;
 const occ=monthOcc(cur.y,cur.m),paid=occ.filter(o=>o.st==='paid').length,s=calc();
 return `<section class="panel dcard dgoal" data-sec="Goals"><div class="dgh"><span class="dgt">${ic('target','sm')}Goals</span><button class="hb" data-v2="goals" aria-label="Open goals">${ic('r')}</button></div>
 <small>Saved for your goals</small><div class="dgv"><b>${peso(saved)}</b>${target?`<span>${pc}% of ${peso(target)}</span>`:''}</div>
 <div class="dgm"><button data-v2="goals"><small>${ic('target','sm')}Active goals</small><b>${gs.length||'None yet'}</b></button><button data-v2="bills"><small>${ic('cal','sm')}Bills paid</small><b>${occ.length?paid+' of '+occ.length:'No bills'}</b></button>${s.saved>0?`<button data-v2="goals"><small>${ic('up','sm')}Added this month</small><b>${peso(s.saved)}</b></button>`:''}</div></section>`}

// Short, specific notes worked out from the user's own numbers. Nothing here is a guess.
function insights(){
 const s=calc(),out=[],day=isCur()?now.getDate():31,p=prevOf(cur.y,cur.m),last=spendBy(p.y,p.m,day);
 const tag=t=>`<span class="itag">${t}</span>`;
 if(isCur()){const due=upcoming(7);if(due.length){const tot=due.reduce((a,o)=>a+(o.rem||o.amt||0),0);out.push({i:'cal',k:'Bills',t:`${due.length} bill${due.length>1?'s':''} due this week`,d:`${due.slice(0,3).map(o=>esc(o.b.name)).join(', ')}${due.length>3?' and more':''}, ${peso(tot)} in all.`,go:'bills'})}}
 const al=isCur()?budgetAlerts(cur.y,cur.m):[];if(al.length)out.push({i:'alert',k:'Budget',t:al[0].lvl==='over'?'A budget is over':'A budget is nearly used',d:esc(al[0].t)+'.',go:'budgets'});
 const ups=S.cats.map(c=>({c,now:s.by[c.id]||0,was:last.by[c.id]||0})).filter(x=>x.was>0&&x.now>x.was*1.1&&x.now-x.was>=100).sort((a,b)=>(b.now-b.was)-(a.now-a.was))[0];
 if(ups)out.push({i:'chart',k:'Spending',t:`${esc(ups.c.name)} is up ${Math.round((ups.now/ups.was-1)*100)}%`,d:`${peso(ups.now)} so far, against ${peso(ups.was)} by this day last month.`,go:'history'});
 const down=S.cats.map(c=>({c,now:s.by[c.id]||0,was:last.by[c.id]||0})).filter(x=>x.was>=200&&x.now<x.was*.8).sort((a,b)=>(b.was-b.now)-(a.was-a.now))[0];
 if(down)out.push({i:'check',k:'Nice',t:`Less on ${esc(down.c.name)}`,d:`${peso(down.was-down.now)} less than by this day last month.`,go:'history'});
 if(isCur()&&s.income>0)out.push({i:'wallet',k:'Daily',t:`About ${peso(Math.max(0,s.free))} a day`,d:`That is what you can spend each day until ${MN[cur.m]} ${s.dm} after your unpaid bills.`,go:'budgets'});
 const g=S.goals.filter(g=>g.target>0&&g.saved<g.target).sort((a,b)=>b.saved/b.target-a.saved/a.target)[0];
 if(g)out.push({i:'target',k:'Goal',t:`${esc(g.name)} is ${Math.round(g.saved/g.target*100)}% there`,d:`${peso(g.target-g.saved)} to go.${g.auto?` Saving ${peso(g.auto)} a month gets there in about ${Math.ceil((g.target-g.saved)/g.auto)} months.`:''}`,go:'goals'});
 const noBudget=S.cats.filter(c=>budgetOf(c)<=0&&s.by[c.id]>0).length;
 if(noBudget)out.push({i:'tag',k:'Tip',t:`${noBudget} categor${noBudget>1?'ies have':'y has'} no budget`,d:'Give them a monthly limit so Tally can warn you before you overspend.',go:'budgets'});
 if(!out.length)return '';
 return `<section class="panel dins" data-sec="Insights"><div class="sec"><h2>Insights</h2><span class="mute">${out.length} for ${MN[cur.m]}</span></div><div class="insr">${out.slice(0,6).map(x=>`<button class="ins" data-v2="${x.go}"><div class="ih"><span class="dic">${ic(x.i)}</span>${tag(x.k)}</div><b>${x.t}</b><p>${x.d}</p></button>`).join('')}</div></section>`}

export {spendCard,earnCard,goalCard,insights};

// Balance currency switch: the budget currency plus two others, shown at today's live rate (display only).
import {liveRate,liveInfo,liveStale,refreshLive,when} from './fx.js';
let balCur=null,tried=0;try{balCur=localStorage.getItem('ipon-balcur')}catch(e){}
const setBalCur=c=>{balCur=c;try{localStorage.setItem('ipon-balcur',c)}catch(e){}};
const symOf=c=>{try{return new Intl.NumberFormat('en',{style:'currency',currency:c,currencyDisplay:'narrowSymbol'}).formatToParts(0).find(p=>p.type==='currency').value}catch(e){return c}};
const fmtIn=(c,v)=>{try{return new Intl.NumberFormat('en-US',{style:'currency',currency:c,currencyDisplay:'narrowSymbol',minimumFractionDigits:2,maximumFractionDigits:2}).format(v)}catch(e){return c+' '+v.toFixed(2)}};
function balChoices(){const main=S.currency||'PHP',seen=[];
 [...S.pay,...S.tx].forEach(x=>{const c=x.fx&&x.fx.c;if(c&&c!==main&&!seen.includes(c))seen.push(c)});
 ['USD','EUR','SGD','JPY'].forEach(c=>{if(c!==main&&!seen.includes(c))seen.push(c)});
 return [main,...seen.slice(0,2)]}
function balSwitch(left){
 const list=balChoices(),main=list[0],c=list.includes(balCur)?balCur:main,r=c===main?1:liveRate(c);
 // Fetch once a minute at most, so being offline cannot loop.
 if(c!==main&&!r&&Date.now()-tried>6e4){tried=Date.now();refreshLive().then(()=>import('./render.js').then(m=>m.render())).catch(()=>{})}
 const chips=`<div class="dcs" role="group" aria-label="Show balance in">${list.map(x=>`<button type="button" data-bcur="${x}" class="${x===c?'on':''}" aria-pressed="${x===c}">${x===c?`<span class="dsy">${esc(symOf(x))}</span>`:''}${x}</button>`).join('')}</div>`;
 if(c===main)return{chips,conv:null};
 const info=liveInfo();
 return{chips,conv:r?{val:fmtIn(c,left/r),note:`1 ${c} = ${peso(r)}`,at:info?'Rate from '+when(info.updated):''}:{val:'…',note:'Getting today’s rate'}};
}
export {balSwitch,setBalCur};
