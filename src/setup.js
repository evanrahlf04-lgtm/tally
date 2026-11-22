import {$,esc,CURRENCIES,curCode,setCurrency,sym} from './util.js';
import {S,T,save,setView} from './state.js';
import {refreshPHP} from './fx.js';
import {syncIncome} from './views/tax.js';
import {setStab} from './views/salary.js';
import {render} from './render.js';

// First-run setup: a short step-by-step flow shown once for an empty account, and again after "Reset everything".
const STEPS=4;
let step=0,open=false,draft={name:'',mode:'amount',amount:''};

export const needsSetup=()=>S.setup===false;

const bars=()=>`<div class="sbars" role="img" aria-label="Step ${step+1} of ${STEPS}">${Array.from({length:STEPS},(_,i)=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div>`;

function screen(){
 const first=(draft.name.trim().split(/\s+/)[0])||'there';
 const head=(h,sub)=>`<h1>${h}</h1><p class="ssub">${sub}</p>`;
 if(step===0)return head('What should we call you?','Just a first name or nickname. It only appears in your account menu.')+
  `<label class="fld big"><span class="sr">Your name</span><input id="sn" name="n" autocomplete="given-name" maxlength="40" placeholder="Your name" value="${esc(draft.name)}"></label>`;
 if(step===1)return head('Which currency do you use?','Every amount in Tally shows in this currency. You can change it later from your account menu.')+
  `<label class="fld"><span class="sr">Currency</span><select id="sc">${CURRENCIES.map(([c,n])=>`<option value="${c}" ${c===curCode()?'selected':''}>${c} · ${esc(n)}</option>`).join('')}</select></label>`;
 if(step===2)return head('How much money do you have now?','This is your starting balance. Income you log adds to it and spending takes from it.')+
  `<div class="seg sseg" id="sm"><button type="button" data-m="amount" class="${draft.mode==='amount'?'on':''}">Starting amount</button><button type="button" data-m="salary" class="${draft.mode==='salary'?'on':''}">Use my salary</button></div>`+
  (draft.mode==='amount'
   ?`<label class="fld big"><span class="sr">Starting amount</span><input id="sa" type="number" inputmode="decimal" step="0.01" min="0" placeholder="${esc(sym().trim())} 0.00" value="${esc(draft.amount)}"></label><p class="note">Not sure? Enter what is in your wallet and accounts today. You can change it any time.</p>`
   :`<p class="note" style="margin-top:16px">Your take-home pay from the Salary page is added to your money every month. After setup you will land on the Salary page to enter your pay.</p>`);
 return head(`You are set, ${esc(first)}`,'Your budget is ready. A good next step is to give each category a monthly budget, then add your bills and goals.')+
  `<div class="sdone"><div><b>${esc(draft.name.trim()||'No name yet')}</b><small>Name</small></div><div><b>${esc(curCode())}</b><small>Currency</small></div><div><b>${draft.mode==='salary'?'My salary':(draft.amount?sym()+Number(draft.amount).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'Not set')}</b><small>Starting money</small></div></div>`;
}

function draw(){
 const el=$('#setup');
 el.innerHTML=`<div class="swrap">${bars()}<form id="sf" novalidate>${screen()}<p class="amsg" id="sm2" role="alert"></p><div class="sbtns"><button class="btn" id="snext">${step===STEPS-1?'Open my budget':'Continue'}</button>${step>0?`<button type="button" class="btn g" id="sback">Back</button>`:''}</div></form>${step<STEPS-1?`<button type="button" class="sskip" id="sskip">Skip setup</button>`:''}</div>`;
 const say=t=>{$('#sm2').textContent=t};
 const read=()=>{const n=$('#sn'),a=$('#sa');if(n)draft.name=n.value;if(a)draft.amount=a.value};
 $('#sf').onsubmit=e=>{
  e.preventDefault();read();
  if(step===0&&!draft.name.trim())return say('Enter a name, or skip setup.');
  if(step===1){const c=$('#sc').value;if(c!==curCode()){S.currency=c;setCurrency(c);S.tax.cur=c;delete S.fxPHP}}
  if(step===2&&draft.mode==='amount'&&draft.amount!==''&&!(parseFloat(draft.amount)>=0))return say('Enter a number, or leave it empty for now.');
  if(step<STEPS-1){step++;draw();return}
  finish(false);
 };
 const b=$('#sback');if(b)b.onclick=()=>{read();step--;draw()};
 const k=$('#sskip');if(k)k.onclick=()=>{read();finish(true)};
 el.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{read();draft.mode=x.dataset.m;draw()});
 const f=$('#sn')||$('#sa');if(f&&!matchMedia('(pointer:coarse)').matches)f.focus();
}

function finish(skipped){
 const n=draft.name.trim().slice(0,40);if(n)S.name=n;
 const c=curCode();if(c!=='PHP')refreshPHP(()=>{syncIncome();save();render()});
 if(!skipped||draft.amount!==''||draft.mode==='salary'){
  if(draft.mode==='salary'){S.base='salary';S.tax.link=true;syncIncome()}
  else{const v=parseFloat(draft.amount);S.base='amount';S.tax.link=false;S.start={amount:v>0?v:0,repeat:false,date:T};S.income=0}
 }
 S.setup=true;save();
 const el=$('#setup');el.hidden=true;el.innerHTML='';open=false;document.body.style.overflow='';
 if(draft.mode==='salary'&&!skipped){setStab('calc');setView('tax')}else setView('home');
 window.scrollTo({top:0});render();
}

export function showSetup(){
 if(open)return;
 open=true;step=0;draft={name:S.name||'',mode:'amount',amount:''};
 let el=$('#setup');if(!el){el=document.createElement('div');el.id='setup';document.body.appendChild(el)}
 el.hidden=false;document.body.style.overflow='hidden';draw();
}
