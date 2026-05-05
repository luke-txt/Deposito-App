// diario.js — Movimentações diárias

// ══════════════════════════════════════════════════════════
// DIÁRIO
// ══════════════════════════════════════════════════════════
let diarioSnap=null;
function renderDiario() {
  const data=document.getElementById('data-diario').value;
  const cont=document.getElementById('lista-diario'), tots=document.getElementById('diario-totais');
  cont.innerHTML='<div class="empty">⏳ Carregando...</div>';
  db.ref('logs/'+data).once('value').then(snap=>{
    diarioSnap=snap; cont.innerHTML=''; tots.innerHTML='';
    if(!snap.exists()){ cont.innerHTML='<div class="empty">📭 Nenhuma movimentação.</div>'; return; }
    let tE=0,tS=0; const logs=[]; snap.forEach(l=>{ if(l.val()) logs.push(l.val()); }); logs.reverse();
    logs.forEach(log=>{
      const ent=log.tipo==='ENTRADA'; ent?tE+=log.qtd:tS+=log.qtd;
      const unidLog=(cache[log.code]&&cache[log.code].unidade)?cache[log.code].unidade:(log.unidade||'un');
      const el=document.createElement('div'); el.className='log-card';
      el.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><span style="font-size:20px">${ent?'📥':'📤'}</span><div><div class="log-nome">${log.nome||log.code}</div><div class="log-hora">${log.hora||''} ${log.usuario ? '· ' + (usuariosCache[log.usuario] || log.usuario.split('@')[0]) : ''}</div>${log.obs?`<div class="log-obs">💬 ${log.obs}</div>`:''}</div></div><div style="text-align:right"><div class="log-qty" style="color:${ent?'var(--green)':'var(--red)'}">${ent?'+':'-'}${log.qtd}</div><div style="font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px">${unidLog}</div></div>`;
      cont.appendChild(el);
    });
    tots.innerHTML=`<div style="flex:1;background:var(--green-dim);border:1px solid var(--green);border-radius:10px;padding:10px 14px"><div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase">Entradas</div><div style="font-size:22px;font-weight:900;color:var(--green);font-family:'JetBrains Mono',monospace">+${tE}</div></div><div style="flex:1;background:var(--red-dim);border:1px solid var(--red);border-radius:10px;padding:10px 14px"><div style="font-size:10px;font-weight:700;color:var(--red);text-transform:uppercase">Saídas</div><div style="font-size:22px;font-weight:900;color:var(--red);font-family:'JetBrains Mono',monospace">-${tS}</div></div>`;
  });
}

