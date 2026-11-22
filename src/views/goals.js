import {esc,peso,MN,ic} from '../util.js';
import {S} from '../state.js';
import {tone,topbar} from '../ui.js';
import {contribs} from '../goals.js';
const ord=n=>n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');

// What to set aside each month to reach the goal by its target date.
function pace(g){
 if(g.saved>=g.target)return {t:'Goal reached',cls:'ok'};
 if(!g.date)return null;
 const end=new Date(g.date+'T00:00'),days=(end-new Date())/864e5,tag=`${end.getDate()} ${MN[end.getMonth()]} ${end.getFullYear()}`;
 if(days<0)return {t:`Target date passed (${tag})`,cls:'late'};
 const months=Math.max(1,Math.ceil(days/30.44));
 return {t:`${peso(Math.ceil((g.target-g.saved)/months*100)/100)} a month to finish by ${tag}`,cls:''};
}
// Recent contributions for a goal. Tap one to edit or delete it.
function hist(g){const h=contribs(g);if(!h.length)return '';const d=t=>{const x=new Date(t.date+'T00:00');return `${x.getDate()} ${MN[x.getMonth()]} ${x.getFullYear()}`};
 return `<details class="gh"><summary>${h.length} contribution${h.length>1?'s':''} · ${peso(h.reduce((a,t)=>a+t.amount,0))}</summary>${h.slice(0,10).map(t=>`<button class="ghr" data-edit="${t.id}"><span>${d(t)}</span><span class="mute">${esc(t.note||'')}</span><b>+${peso(t.amount)}</b></button>`).join('')}${h.length>10?`<div class="mute" style="font-size:12px;padding:6px 0">${h.length-10} older ones are in your transactions.</div>`:''}</details>`}
function summary(){if(!S.goals.length)return '';const saved=S.goals.reduce((a,g)=>a+g.saved,0),target=S.goals.reduce((a,g)=>a+g.target,0),p=target?Math.min(100,saved/target*100):0,auto=S.goals.reduce((a,g)=>a+(g.auto||0),0),next=S.goals.filter(g=>g.date&&g.saved<g.target).sort((a,b)=>a.date.localeCompare(b.date))[0];
 const nx=next?new Date(next.date+'T00:00'):null;
 return `<section class="panel fade dsk" data-nojump><div class="hrow" style="align-items:flex-end"><div><div class="lab">Saved so far</div><div class="serif" style="font-size:28px;font-weight:600">${peso(saved)} <span class="mute" style="font-size:16px;font-weight:500">of ${peso(target)}</span></div></div><div class="sub" style="text-align:right">${auto?`Saving ${peso(auto)} a month automatically<br>`:''}${next?`Next target: <b>${esc(next.name)}</b> by ${nx.getDate()} ${MN[nx.getMonth()]} ${nx.getFullYear()}`:'No target dates set yet'}</div></div><div class="meter"><i style="width:${p}%"></i></div></section>`}

// The one goal in front and centre: whichever is still in progress and closest to done, or the first if all are reached.
function featuredCard(g){
 const p=Math.min(100,g.saved/g.target*100),done=g.saved>=g.target,pc=pace(g);
 return `<section class="panel dcard ghero" data-sec="Featured"><div class="ghh"><span class="gbadge ${done?'ok':''}">${ic(done?'check':'target','sm')}${done?'Goal reached':'In progress'}</span><button class="hb" data-editgoal="${g.id}" aria-label="Edit ${esc(g.name)}">${ic('edit','sm')}</button></div>
 <b class="gname">${esc(g.name)}</b>
 <div class="gamt">${peso(g.saved)}<span> of ${peso(g.target)}</span></div>
 <div class="bar"><i style="width:${p}%;background:var(--forest)"></i></div>
 <div class="gfoot"><span class="gpc">${Math.round(p)}%</span>${pc?`<span>${pc.t}</span>`:''}</div>
 <button class="btn" data-fund="${g.id}" style="margin-top:16px;width:100%">${ic('plus','sm')}Add money</button>
 ${g.auto>0?`<div class="pace" style="margin-top:10px">${ic('cal','sm')}Saving ${peso(g.auto)} on the ${ord(g.autoDay)} each month. See Payables.</div>`:''}
 ${hist(g)}</section>`}

// Every other goal, as a compact row: icon, name, fraction, percent, with the pace note and history tucked underneath.
function otherRow(g){
 const p=Math.min(100,g.saved/g.target*100),done=g.saved>=g.target,pc=pace(g);
 return `<div class="orow"><div class="oh">${tone(68,'target')}<button class="on" data-editgoal="${g.id}"><b>${esc(g.name)}</b><small>${peso(g.saved)} of ${peso(g.target)}</small></button><span class="opc ${done?'ok':''}">${Math.round(p)}%</span><button class="btn sm g" data-fund="${g.id}" aria-label="Add to ${esc(g.name)}">${ic('plus','sm')}</button></div>${pc?`<div class="pace ${pc.cls}">${ic(pc.cls==='late'?'alert':pc.cls==='ok'?'check':'cal','sm')}${pc.t}</div>`:''}${g.auto>0?`<div class="pace">${ic('cal','sm')}Saving ${peso(g.auto)} on the ${ord(g.autoDay)} each month. See Payables.</div>`:''}${hist(g)}</div>`}

function goals(){
 const saved=S.goals.reduce((a,g)=>a+g.saved,0),target=S.goals.reduce((a,g)=>a+g.target,0);
 if(!S.goals.length)return topbar('Goals','Money set aside for later',true)+`<section class="panel fade" data-nojump><div class="empty">${ic('target','lg')}No goals yet. Add one to start saving toward something.<button class="btn" data-act="addgoal">${ic('plus','sm')}New goal</button></div></section>`;
 const sorted=S.goals.slice().sort((a,b)=>(a.saved>=a.target?1:0)-(b.saved>=b.target?1:0)||(a.date||'9999').localeCompare(b.date||'9999'));
 const featured=sorted[0],rest=sorted.slice(1);
 return topbar('Goals',`${peso(saved)} saved of ${peso(target)}`,true)+summary()
 +featuredCard(featured)
 +(rest.length?`<section class="full fade"><div class="sec"><h2>Other goals</h2><button class="btn sm" data-act="addgoal">${ic('plus','sm')}Goal</button></div><div class="orows">${rest.map(otherRow).join('')}</div></section>`
 :`<section class="full fade" data-nojump><button class="btn g" data-act="addgoal" style="width:100%">${ic('plus','sm')}Add another goal</button></section>`)}
export {goals};
