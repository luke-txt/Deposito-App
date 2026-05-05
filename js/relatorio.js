// relatorio.js — Relatórios e rankings

// ══════════════════════════════════════════════════════════
// RELATÓRIOS
// ══════════════════════════════════════════════════════════
async function renderRelatorio() {
  const itens=Object.values(cache);
  const venc7=itens.filter(i=>{ const d=diasVencer(i.validade); return d!==null&&d<=7; }).length;
  document.getElementById('rel-stats').innerHTML=`<div class="stat-box"><div class="sl">Produtos</div><div class="sv">${itens.length}</div></div><div class="stat-box"><div class="sl">Unidades</div><div class="sv">${itens.reduce((s,i)=>s+(i.saldo||0),0)}</div></div><div class="stat-box"><div class="sl">Vencendo</div><div class="sv${venc7>0?' red':''}">${venc7}</div></div><div class="stat-box"><div class="sl">Frigorífico</div><div class="sv">${itens.filter(i=>i.setor==='FRIGORIFICO').length}</div></div>`;
  const dias=relPeriod==='semana'?7:relPeriod==='mes'?30:365;
  const saidas={},entradas={};
  const proms=[];
  for(let i=0;i<dias;i++){ const d=new Date(); d.setDate(d.getDate()-i); proms.push(db.ref('logs/'+dataLocal(d)).once('value')); }
  const snaps=await Promise.all(proms);
  snaps.forEach(s=>s.forEach(l=>{
    const v=l.val(); if(!v||!v.code) return;
    const key=v.code, nomeCurrent=(cache[key]&&cache[key].nome)?cache[key].nome:(v.nome||key), unid=(cache[key]&&cache[key].unidade)?cache[key].unidade:(v.unidade||'un');
    if(v.tipo==='SAIDA'){ if(!saidas[key]) saidas[key]={nome:nomeCurrent,qtd:0,unidade:unid}; saidas[key].qtd+=Number(v.qtd)||0; }
    else{ if(!entradas[key]) entradas[key]={nome:nomeCurrent,qtd:0,unidade:unid}; entradas[key].qtd+=Number(v.qtd)||0; }
  }));
  renderRanking('rank-saidas',saidas,'var(--red)');
  renderRanking('rank-entradas',entradas,'var(--green)');
}
function renderRanking(id,data,cor) {
  const el=document.getElementById(id);
  const sorted=Object.values(data).sort((a,b)=>b.qtd-a.qtd).slice(0,10);
  if(!sorted.length){ el.innerHTML='<div class="empty">Sem dados no período.</div>'; return; }
  const max=sorted[0].qtd;
  el.innerHTML=sorted.map((item,i)=>`<div class="rank-item"><div class="rank-n">${i+1}</div><div class="rank-bar-wrap"><div class="rank-nome">${item.nome}</div><div class="rank-bar"><div class="rank-fill" style="width:${(item.qtd/max*100).toFixed(0)}%;background:${cor}"></div></div></div><div class="rank-qty" style="color:${cor}">${item.qtd} <span style="font-size:10px;font-weight:400;color:var(--muted)">${item.unidade}</span></div></div>`).join('');
}

