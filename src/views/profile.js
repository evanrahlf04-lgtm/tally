import {esc,peso,ic,curCode,sym} from '../util.js';
import {S,user,calc,cur,baseIncome,isBalance} from '../state.js';
import {monthOcc} from '../bills.js';

// Profile: who you are, three numbers for this month, and every setting in one list.
function profile(){
 const s=calc(),name=S.name||(user&&user.email?user.email.split('@')[0]:'You'),occ=monthOcc(cur.y,cur.m),paid=occ.filter(o=>o.st==='paid').length;
 const days=new Set(s.tx.map(t=>t.date)).size,dark=document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
 const row=(attr,icn,label,val='',cls='')=>`<button class="prow ${cls}" ${attr}><span class="dic">${ic(icn)}</span><span class="pl">${label}</span>${val?`<em>${val}</em>`:''}${cls==='danger'?'':ic('r','sm')}</button>`;
 const sw=(attr,icn,label,on)=>`<button class="prow" ${attr} role="switch" aria-checked="${on}"><span class="dic">${ic(icn)}</span><span class="pl">${label}</span><span class="sw ${on?'on':''}"><i></i></span></button>`;
 return `<div class="top hist"><button class="hb" data-v2="home" aria-label="Back to Overview">${ic('l')}</button><div class="tt"><h1 class="serif">Profile</h1><small>${esc(user?user.email:'')}</small></div><span></span></div>
 <div class="pgrid fade">
 <section class="panel pcard" data-nojump><span class="pav">${esc(name.slice(0,1).toUpperCase())}</span><div class="pn"><b>${esc(name)}</b><small>${esc(user?user.email:'')}</small></div><button class="hb" data-act="editname" aria-label="Edit name">${ic('edit','sm')}</button></section>
 <section class="panel pstats" data-nojump><div><span class="dic">${ic('cal')}</span><b>${days}</b><small>Days with entries</small></div><div><span class="dic">${ic('target')}</span><b>${peso(s.saved)}</b><small>Added to goals</small></div><div><span class="dic">${ic('check')}</span><b>${occ.length?paid+' of '+occ.length:'None'}</b><small>Bills paid</small></div></section>
 <section class="panel plist" data-nojump><h2>Money</h2>
  ${row('data-act="income"','wallet','Starting amount or salary',S.base==='salary'?'Salary':isBalance()?peso(S.start.amount||0):peso(baseIncome()))}
  ${row('data-act="currency"','tag','Currency',`${curCode()} ${esc(sym().trim())}`)}
  ${sw('id="palerts"','bell','Budget alerts',!!S.alerts.on)}
 </section>
 <section class="panel plist" data-nojump><h2>App</h2>
  ${sw('data-act="theme"','moon','Dark mode',dark)}
  ${row('data-act="csv"','down','Export transactions (CSV)')}
  ${row('data-act="backup"','down','Backup (JSON)')}
  ${row('data-act="restore"','up','Restore backup')}
 </section>
 <section class="panel plist" data-nojump><h2>Account</h2>
  ${row('data-act="reset"','x','Reset everything','','danger')}
  ${row('data-act="signout"','logout','Sign out','','danger')}
 </section></div>`}
export {profile};
