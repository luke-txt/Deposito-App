// utils.js — Funções auxiliares

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function dataLocal(d){
  const dt=d||new Date();
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}
function diasVencer(v){
  if(!v) return null;
  const [y,m,d]=v.split('-').map(Number);
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  return Math.ceil((new Date(y,m-1,d)-hoje)/86400000);
}
function toast(msg,type){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className='show '+(type||'ok');
  clearTimeout(el._t); el._t=setTimeout(()=>el.className='',3400);
}
function saudacao(){
  const h=new Date().getHours();
  return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}
function nivelLabel(nivel){
  if(nivel==='ADMIN')      return '<span class="badge b-red">Admin</span>';
  if(nivel==='SUPERVISOR') return '<span class="badge b-yellow">Supervisor</span>';
  return '<span class="badge b-green">Operador</span>';
}
function barcodeVisual(code){
  let x=0,bars='',seed=code.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const n=Math.max(code.length,8)*11,unit=160/n;
  for(let i=0;i<n;i++){const w=unit*(1+((seed*(i+1)*7)%3));if(i%2===0)bars+=`<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="40" fill="#e8eaf0"/>`;x+=w;}
  return `<svg viewBox="0 0 ${x.toFixed(0)} 40" xmlns="http://www.w3.org/2000/svg" style="background:#0d0f14;width:100%;height:50px">${bars}</svg>`;
}

