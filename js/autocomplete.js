// autocomplete.js — Busca e sugestão de produtos na saída

// ══════════════════════════════════════════════════════════
// AUTOCOMPLETE
// ══════════════════════════════════════════════════════════
function onSaiBuscaInput() {
  const val=document.getElementById('sai-busca').value.trim().toLowerCase();
  document.getElementById('sai-code').value='';
  document.getElementById('sai-preview-box').style.display='none';
  acIdx=-1;
  if(!val){ document.getElementById('ac-list').style.display='none'; return; }
  if(cacheReady){ buildAcList(val); return; }
  const list=document.getElementById('ac-list');
  list.innerHTML='<div class="ac-item" style="color:var(--muted);cursor:default">Carregando...</div>';
  list.style.display='block';
  db.ref('estoque').once('value').then(snap=>{
    snap.forEach(c=>{ const v=c.val(); if(!v) return; cache[c.key]={nome:v.nome||c.key,saldo:Number(v.saldo)||0,setor:v.setor||'SECO',validade:v.validade||'',unidade:v.unidade||'un',minimo:Number(v.minimo)||0}; });
    cacheReady=true;
    const cur=document.getElementById('sai-busca').value.trim().toLowerCase();
    if(cur) buildAcList(cur); else list.style.display='none';
  }).catch(()=>toast('Erro ao buscar','err'));
}

function buildAcList(val) {
  const list=document.getElementById('ac-list'); list.innerHTML='';
  acItems=Object.entries(cache).filter(([code,item])=>
    (item.nome||'').toLowerCase().includes(val)||(code||'').toLowerCase().includes(val)
  ).sort((a,b)=>(a[1].nome||'').localeCompare(b[1].nome||'')).slice(0,10);
  if(!acItems.length){
    const el=document.createElement('div'); el.className='ac-item'; el.style.cssText='color:var(--muted);cursor:default'; el.textContent='Nenhum produto encontrado';
    list.appendChild(el); list.style.display='block'; return;
  }
  acItems.forEach(([code,item])=>{
    const el=document.createElement('div'); el.className='ac-item';
    const left=document.createElement('div');
    const n=document.createElement('div'); n.className='ac-name'; n.textContent=item.nome;
    const c=document.createElement('div'); c.className='ac-code'; c.textContent=code;
    left.append(n,c);
    const badge=document.createElement('span'); badge.className='badge '+(item.saldo>0?'b-green':'b-red'); badge.textContent=item.saldo+' '+(item.unidade||'un');
    el.append(left,badge);
    el.addEventListener('mousedown',ev=>{ ev.preventDefault(); selecionarItem(code); });
    list.appendChild(el);
  });
  list.style.display='block';
}

function onSaiBuscaKeydown(ev) {
  const list=document.getElementById('ac-list');
  const items=list.querySelectorAll('.ac-item');
  if(!items.length||list.style.display==='none') return;
  if(ev.key==='ArrowDown'){acIdx=Math.min(acIdx+1,items.length-1);ev.preventDefault();}
  else if(ev.key==='ArrowUp'){acIdx=Math.max(acIdx-1,0);ev.preventDefault();}
  else if(ev.key==='Enter'&&acIdx>=0){ev.preventDefault();if(acItems[acIdx])selecionarItem(acItems[acIdx][0]);return;}
  else return;
  items.forEach((el,i)=>el.classList.toggle('sel',i===acIdx));
  items[acIdx]?.scrollIntoView({block:'nearest'});
}

function selecionarItem(code) {
  const item=cache[code];
  if(!item){ toast('Produto não encontrado','err'); return; }
  document.getElementById('sai-code').value=code;
  document.getElementById('sai-busca').value=item.nome;
  document.getElementById('ac-list').style.display='none';
  document.getElementById('sai-preview-box').style.display='block';
  document.getElementById('prev-nome').textContent=item.nome;
  document.getElementById('prev-saldo').textContent=item.saldo+' '+(item.unidade||'un')+' em estoque';
  document.getElementById('prev-saldo').className='badge '+(item.saldo>0?'b-green':'b-red');
  const dias=diasVencer(item.validade);
  const vel=document.getElementById('prev-val');
  vel.textContent=item.validade?'Val: '+item.validade:'Sem validade';
  vel.className='badge '+(dias!==null&&dias<=7?'b-red':dias!==null&&dias<=30?'b-yellow':'b-gray');
  const minEl=document.getElementById('prev-min');
  if(item.minimo>0){ minEl.textContent='Mín: '+item.minimo+' '+item.unidade; minEl.style.display=''; } else { minEl.style.display='none'; }
}

