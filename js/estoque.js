// estoque.js — Renderização e abas do estoque

// ══════════════════════════════════════════════════════════
// ESTOQUE
// ══════════════════════════════════════════════════════════
function switchEstoqueTab(tab) {
  estoqueTabAtual=tab;
  ['lista','vencimentos','minimo','codigos'].forEach(t=>{ document.getElementById('tab-'+t).style.display=t===tab?'':'none'; });
  renderEstoque();
}

function renderEstoque() {
  if(!document.getElementById('page-estoque').classList.contains('active')) return;
  const filtro=document.getElementById('filtro-estoque').value.trim().toLowerCase();
  const itens=Object.entries(cache).filter(([code,item])=>!filtro||(item.nome||'').toLowerCase().includes(filtro)||code.toLowerCase().includes(filtro)).sort((a,b)=>(a[1].nome||'').localeCompare(b[1].nome||''));
  const somaBar=document.getElementById('soma-bar');
  if(filtro&&itens.length){
    document.getElementById('soma-val').textContent=itens.reduce((s,[,i])=>s+(i.saldo||0),0);
    document.getElementById('soma-sub').textContent=itens.length+' produto'+(itens.length!==1?'s':'');
    somaBar.style.display='flex';
  } else { somaBar.style.display='none'; }
  if(estoqueTabAtual==='lista') renderLista(itens);
  else if(estoqueTabAtual==='vencimentos') renderVencimentos(itens);
  else if(estoqueTabAtual==='minimo') renderMinimo(itens);
  else renderCodigos(itens);
}

function renderLista(itens) {
  const frigo=document.getElementById('tbody-frigo'), secos=document.getElementById('tbody-secos');
  frigo.innerHTML=''; secos.innerHTML='';
  itens.forEach(([code,item])=>{
    const dias=diasVencer(item.validade);
    const vc=dias!==null&&dias<=7?'venc':dias!==null&&dias<=30?'venc-soon':'';
    const baixo=item.minimo>0&&item.saldo<item.minimo;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><div style="display:flex;align-items:center;gap:8px"><div><b>${item.nome}</b>${baixo?` <span class="badge b-yellow" style="font-size:9px;padding:2px 6px">BAIXO</span>`:''}<div style="font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace">${code}</div></div><button class="btn-edit" data-edit-code="${code}" title="Editar">✏️</button></div></td><td style="text-align:center"><span class="badge ${item.saldo>0?'b-green':'b-red'}">${item.saldo} ${item.unidade||'un'}</span></td><td class="${vc}">${item.validade||'—'}</td>`;
    (item.setor==='FRIGORIFICO'?frigo:secos).appendChild(tr);
  });
  if(!frigo.children.length) frigo.innerHTML='<tr><td colspan="3" class="empty">Vazio</td></tr>';
  if(!secos.children.length) secos.innerHTML='<tr><td colspan="3" class="empty">Vazio</td></tr>';
}

function renderVencimentos(itens) {
  const crit=document.getElementById('tbody-venc-crit'), aviso=document.getElementById('tbody-venc-aviso');
  crit.innerHTML=''; aviso.innerHTML='';
  itens.forEach(([,item])=>{
    if(!item.validade) return; const dias=diasVencer(item.validade); if(dias===null||dias>30) return;
    const row=`<tr><td><b>${item.nome}</b></td><td>${item.setor==='FRIGORIFICO'?'🥩':'📦'}</td><td class="${dias<=7?'venc':'venc-soon'}">${item.validade} (${dias<=0?'VENCIDO':dias+'d'})</td><td style="text-align:center">${item.saldo} ${item.unidade||'un'}</td></tr>`;
    (dias<=7?crit:aviso).innerHTML+=row;
  });
  if(!crit.innerHTML) crit.innerHTML='<tr><td colspan="4" class="empty">✅ Nenhum crítico</td></tr>';
  if(!aviso.innerHTML) aviso.innerHTML='<tr><td colspan="4" class="empty">✅ Nenhum aviso</td></tr>';
}

function renderMinimo(itens) {
  const tbody=document.getElementById('tbody-minimo'); tbody.innerHTML='';
  const comMinimo=itens.filter(([,i])=>i.minimo>0).sort((a,b)=>a[1].saldo/a[1].minimo-b[1].saldo/b[1].minimo);
  if(!comMinimo.length){ tbody.innerHTML='<tr><td colspan="4" class="empty">Nenhum produto com mínimo definido.</td></tr>'; return; }
  comMinimo.forEach(([,item])=>{
    const ok=item.saldo>=item.minimo, pct=Math.min((item.saldo/item.minimo*100),100).toFixed(0);
    tbody.innerHTML+=`<tr><td><b>${item.nome}</b></td><td style="text-align:center"><span class="badge ${ok?'b-green':'b-red'}">${item.saldo} ${item.unidade||'un'}</span></td><td style="text-align:center;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:12px">${item.minimo} ${item.unidade||'un'}</td><td style="text-align:center"><div style="background:var(--border);border-radius:4px;height:6px;width:60px;display:inline-block;overflow:hidden"><div style="height:100%;width:${pct}%;background:${ok?'var(--green)':'var(--red)'};border-radius:4px"></div></div><div style="font-size:10px;color:${ok?'var(--green)':'var(--red)'};margin-top:2px;font-family:'JetBrains Mono',monospace">${pct}%</div></td></tr>`;
  });
}

function renderCodigos(itens) {
  const grid=document.getElementById('bc-grid');
  if(!itens.length){ grid.innerHTML='<div class="empty">🏷️ Nenhum produto</div>'; return; }
  grid.innerHTML=itens.map(([code,item])=>`<div class="bc-card"><div class="bc-nome">${item.nome}</div><div class="bc-code">${code}</div>${barcodeVisual(code)}<div class="bc-saldo">Saldo: <b>${item.saldo} ${item.unidade||'un'}</b> | ${item.setor==='FRIGORIFICO'?'🥩':'📦'}</div></div>`).join('');
}

