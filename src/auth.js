import {$,esc,ic} from './util.js';
import {sb} from './sync.js';

const back=()=>location.origin+location.pathname;
const TITLES={
 welcome:['Know where every peso goes','Budget, bills, debts and Philippine tax estimates in one place.'],
 signin:['Welcome back','Sign in to see your budget.'],
 signup:['Create your account','Your budget is private to your account.'],
 forgot:['Reset password','We will email you a link to choose a new one.'],
 recover:['Choose a new password','Use at least 8 characters.'],
 setup:['Setup needed','This copy of Tally is not connected to a server yet.']
};

// Welcome illustration: a phone showing a balance and a donut, with currency chips floating round it.
const ART=`<svg class="aart" viewBox="0 0 320 300" role="img" aria-label="A phone showing a balance and spending chart"><defs>
<linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1f7ec"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#1d4a2e" flood-opacity=".18"/></filter></defs>
<g transform="rotate(-6 160 150)" filter="url(#sh)"><rect x="92" y="18" width="136" height="268" rx="28" fill="#14211a"/><rect x="99" y="25" width="122" height="254" rx="22" fill="url(#ph)"/>
<rect x="140" y="32" width="40" height="9" rx="4.5" fill="#14211a"/>
<text x="112" y="70" font-size="9" fill="#5b6a61" font-family="inherit">Your balance</text><text x="112" y="92" font-size="19" font-weight="600" fill="#14211a" font-family="inherit">₱18,971</text>
<rect x="112" y="102" width="62" height="16" rx="8" fill="#1d4a2e"/><rect x="178" y="102" width="30" height="16" rx="8" fill="#e2eadc"/>
<circle cx="160" cy="168" r="30" fill="none" stroke="#e4ece0" stroke-width="10"/><circle cx="160" cy="168" r="30" fill="none" stroke="#8fd14f" stroke-width="10" stroke-dasharray="100 89" stroke-linecap="round" transform="rotate(-90 160 168)"/><circle cx="160" cy="168" r="30" fill="none" stroke="#1d4a2e" stroke-width="10" stroke-dasharray="44 145" stroke-dashoffset="-106" stroke-linecap="round" transform="rotate(-90 160 168)"/>
<rect x="112" y="214" width="96" height="12" rx="6" fill="#e4ece0"/><rect x="112" y="214" width="62" height="12" rx="6" fill="#c8f07e"/><rect x="112" y="236" width="96" height="12" rx="6" fill="#e4ece0"/><rect x="112" y="236" width="38" height="12" rx="6" fill="#9fb3a5"/></g>
<g font-family="inherit" font-weight="600" text-anchor="middle" filter="url(#sh)">
<rect x="22" y="70" width="52" height="52" rx="16" fill="#fff"/><text x="48" y="104" font-size="22" fill="#1d4a2e">₱</text>
<rect x="248" y="44" width="48" height="48" rx="16" fill="#fff"/><text x="272" y="76" font-size="20" fill="#1d4a2e">$</text>
<rect x="250" y="190" width="50" height="50" rx="16" fill="#c8f07e"/><text x="275" y="223" font-size="20" fill="#14211a">€</text>
<rect x="30" y="204" width="44" height="44" rx="14" fill="#fff"/><text x="52" y="233" font-size="18" fill="#1d4a2e">¥</text></g></svg>`;

export function hideAuth(){const a=$('#auth');a.hidden=true;a.innerHTML=''}

export function showAuth(mode,opts={},msg=''){
 const a=$('#auth');a.hidden=false;a.dataset.mode=mode;
 const [h,sub]=TITLES[mode];
 if(mode==='welcome'){
  a.innerHTML=`<div class="awel"><div class="alogo">${ic('logo','lg').replace('class="i lg"','class="logo"')}<b>tally</b></div><h1>Know where <mark>every peso</mark> goes</h1><p>${sub}</p>${ART}<div class="abtns"><button type="button" class="gsb" data-go="signup"><span class="gsk"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 6 6-6 6M13 6l6 6-6 6"/></svg></span><span class="gsl">Get started</span><span class="gsc"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span></button><button type="button" class="ab3" data-go="signin">I already have an account</button></div><small>Your budget is private to your account.</small></div>`;
  a.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showAuth(b.dataset.go));
  return;
 }
 const pw=mode==='signin'||mode==='signup'||mode==='recover';
 const email=mode!=='recover'&&mode!=='setup';
 const body=mode==='setup'
  ?`<p class="note">Set <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> in a <b>.env.local</b> file (see <b>.env.example</b>), then restart the dev server.</p>`
  :`<form id="af" class="authform" novalidate>
   ${email?`<label class="fld">Email<input name="e" type="email" autocomplete="email" required autofocus></label>`:''}
   ${pw?`<label class="fld">${mode==='recover'?'New password':'Password'}<input name="p" type="password" minlength="8" autocomplete="${mode==='signin'?'current-password':'new-password'}" required ${mode==='recover'?'autofocus':''}></label>`:''}
   <p class="amsg" id="am" role="alert">${esc(msg)}</p>
   <button class="btn" id="ab">${{signin:'Sign in',signup:'Create account',forgot:'Send reset link',recover:'Save password'}[mode]}</button>
  </form>
  <div class="alinks">${mode==='signin'?`<button type="button" data-go="forgot">Forgot password?</button><button type="button" data-go="signup">Create an account</button>`:mode==='signup'?`<button type="button" data-go="signin">I already have an account</button>`:mode==='forgot'?`<button type="button" data-go="signin">Back to sign in</button>`:''}</div>`;
 const canBack=mode==='signin'||mode==='signup'||mode==='forgot';
 a.innerHTML=`<div class="aform"><div class="ahead">${canBack?`<button type="button" class="aback" data-go="welcome" aria-label="Back"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>`:''}<div class="alogo">${ic('logo','lg').replace('class="i lg"','class="logo"')}<b>tally</b></div></div><div class="authcard"><h1 class="serif">${h}</h1><p class="sub">${sub}</p>${body}</div></div>`;
 a.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showAuth(b.dataset.go));
 const f=$('#af');if(!f)return;
 f.onsubmit=async ev=>{
  ev.preventDefault();
  const say=(t,ok)=>{const m=$('#am');m.textContent=t;m.className='amsg'+(ok?' ok':'')},btn=$('#ab');
  const e=(f.e&&f.e.value||'').trim(),p=f.p?f.p.value:'';
  if(email&&!/^\S+@\S+\.\S+$/.test(e))return say('Enter a valid email address.');
  if(pw&&mode!=='signin'&&p.length<8)return say('Password must be at least 8 characters.');
  if(pw&&!p)return say('Enter your password.');
  btn.disabled=true;say('');
  try{
   if(mode==='signin'){
    const {error}=await sb.auth.signInWithPassword({email:e,password:p});
    if(error)throw error;
   }else if(mode==='signup'){
    const {data,error}=await sb.auth.signUp({email:e,password:p,options:{emailRedirectTo:back()}});
    if(error)throw error;
    // Email confirmation is on, so there is no session until the link is opened.
    if(!data.session)return showAuth('signin',{},'Check your email to confirm your account, then sign in.'),$('#am').classList.add('ok');
   }else if(mode==='forgot'){
    const {error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:back()});
    if(error)throw error;
    return showAuth('signin',{},'If that email has an account, a reset link is on its way.'),$('#am').classList.add('ok');
   }else if(mode==='recover'){
    const {error}=await sb.auth.updateUser({password:p});
    if(error)throw error;
    const {data}=await sb.auth.getSession();
    opts.done&&opts.done(data.session);
   }
  }catch(err){
   const t=String(err&&err.message||err);
   say(/invalid login/i.test(t)?'Wrong email or password.':/not confirmed/i.test(t)?'Confirm your email first. Check your inbox.':t);
  }
  btn.disabled=false;
 };
}
