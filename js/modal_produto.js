// modal_produto.js — Editar produto e histórico

// ══════════════════════════════════════════════════════════
// MODAL EDITAR PRODUTO
// ══════════════════════════════════════════════════════════
function abrirEditar(code) {
  const item=cache[code]; if(!item){ toast('Item não encontrado.','err'); return; }
  editCode=code;
  document.getElementById('edit-code-label').textContent='Código: '+code;
  document.getElementById('edit-nome').value=item.nome||'';
  document.getElementById('edit-val').value=item.validade||'';
  document.getElementById('edit-setor').value=item.setor||'SECO';
  document.getElementById('edit-unidade').value=item.unidade||'un';
  document.getElementById('edit-saldo').value=item.saldo||0;
  document.getElementById('edit-minimo').value=item.minimo||0;
  document.getElementById('edit-modal').classList.add('open');
}
function fecharModal(){ document.getElementById('edit-modal').classList.remove('open'); editCode=null; }
function salvarEdicao() {
  if(!editCode) return;
  const nome=document.getElementById('edit-nome').value.trim();
  const validade=document.getElementById('edit-val').value;
  const setor=document.getElementById('edit-setor').value;
  const unidade=document.getElementById('edit-unidade').value;
  const saldo=parseFloat(document.getElementById('edit-saldo').value.replace(',','.'));
  const minimo=parseFloat(document.getElementById('edit-minimo').value)||0;
  if(!nome){ toast('Nome obrigatório.','err'); return; }
  if(isNaN(saldo)||saldo<0){ toast('Quantidade inválida.','err'); return; }
  db.ref('estoque/'+editCode).update({nome,validade,setor,unidade,saldo,minimo})
    .then(()=>{
      toast('✅ Produto atualizado!'); fecharModal();
      db.ref('auditoria/edicoes').push({code:editCode,usuario:currentUser?currentUser.email:'',ts:Date.now(),dados:{nome,validade,setor,unidade,saldo,minimo}});
    }).catch(err=>toast('Erro: '+err.code,'err'));
}

// ══════════════════════════════════════════════════════════
// HISTÓRICO DO PRODUTO
// ══════════════════════════════════════════════════════════
async function abrirHistorico(code) {
  const item=cache[code];
  document.getElementById('hist-title').textContent='📜 Histórico — '+(item?item.nome:code);
  document.getElementById('hist-list').innerHTML='<div class="empty">⏳ Carregando...</div>';
  document.getElementById('hist-modal').classList.add('open');
  const proms=[];
  for(let i=0;i<30;i++){ const d=new Date(); d.setDate(d.getDate()-i); proms.push(db.ref('logs/'+dataLocal(d)).orderByChild('code').equalTo(code).once('value')); }
  const snaps=await Promise.all(proms);
  const logs=[];
  snaps.forEach(s=>s.forEach(l=>{ const v=l.val(); if(v) logs.push(v); }));
  if(!logs.length){ document.getElementById('hist-list').innerHTML='<div class="empty">Sem movimentações nos últimos 30 dias.</div>'; return; }
  document.getElementById('hist-list').innerHTML=logs.map(log=>{
    const ent=log.tipo==='ENTRADA';
    return `<div class="hist-item"><div><div style="font-size:13px;font-weight:600">${ent?'📥 Entrada':'📤 Saída'}</div><div class="hist-meta">${log.hora||''} · ${log.usuario||''}</div>${log.obs?`<div style="font-size:11px;color:var(--muted);margin-top:2px">💬 ${log.obs}</div>`:''}</div><div class="hist-qty" style="color:${ent?'var(--green)':'var(--red)'}">${ent?'+':'-'}${log.qtd} ${log.unidade||'un'}</div></div>`;
  }).join('');
}

