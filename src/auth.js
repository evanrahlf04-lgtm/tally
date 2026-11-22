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

// Abstract spheres and rings for the welcome screen: drawn as SVG so it stays sharp and tiny.
const ART=`<svg class="aart" viewBox="0 0 320 240" role="img" aria-label="Spheres and rings"><defs>
<radialGradient id="g1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f1ffc2"/><stop offset=".55" stop-color="#bfe85a"/><stop offset="1" stop-color="#7fae25"/></radialGradient>
<radialGradient id="g2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#eceeef"/><stop offset="1" stop-color="#b3b8bf"/></radialGradient>
<radialGradient id="g3" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9aa1ab"/><stop offset=".45" stop-color="#3b4047"/><stop offset="1" stop-color="#121417"/></radialGradient>
<linearGradient id="g4" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#c9ced6" stop-opacity=".3"/></linearGradient></defs>
<ellipse cx="150" cy="128" rx="118" ry="42" transform="rotate(-24 150 128)" fill="none" stroke="url(#g4)" stroke-width="9" opacity=".75"/>
<ellipse cx="236" cy="96" rx="42" ry="13" transform="rotate(-18 236 96)" fill="url(#g1)"/>
<circle cx="150" cy="128" r="50" fill="url(#g1)"/>
<path d="M44 150c34 32 132 54 214-22" fill="none" stroke="url(#g4)" stroke-width="9" stroke-linecap="round" opacity=".9"/>
<circle cx="72" cy="62" r="22" fill="url(#g2)"/><circle cx="214" cy="46" r="15" fill="url(#g2)"/><circle cx="262" cy="156" r="13" fill="url(#g2)"/><circle cx="100" cy="196" r="10" fill="url(#g2)"/>
<circle cx="226" cy="190" r="17" fill="url(#g3)"/><circle cx="40" cy="120" r="9" fill="url(#g3)"/><circle cx="112" cy="26" r="9" fill="url(#g1)"/></svg>`;

export function hideAuth(){const a=$('#auth');a.hidden=true;a.innerHTML=''}

export function showAuth(mode,opts={},msg=''){
 const a=$('#auth');a.hidden=false;a.dataset.mode=mode;
 const [h,sub]=TITLES[mode];
 if(mode==='welcome'){
  a.innerHTML=`<div class="awel"><div class="alogo">${ic('logo','lg').replace('class="i lg"','class="logo"')}<b>tally</b></div>${ART}<h1>${h}</h1><p>${sub}</p><div class="abtns"><button type="button" class="ab1" data-go="signin">Sign in</button><button type="button" class="ab2" data-go="signup">Create an account</button></div><small>Your budget is private to your account.</small></div>`;
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
