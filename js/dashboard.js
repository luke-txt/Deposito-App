// dashboard.js — Tela inicial com métricas e alertas

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
function renderDashboard() {
  const itens = Object.values(cache);
  const nomeExibir = currentUser ? (currentUser.nome || currentUser.email.split('@')[0]) : '';
  document.getElementById('dash-greeting').textContent = saudacao()+', '+nomeExibir+'!';
  document.getElementById('dash-user-label').textContent =
    (nivelLabel(userLevel).replace(/<[^>]+>/g,'')) + ' · ' +
    new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

  const vencendo = itens.filter(i=>{ const d=diasVencer(i.validade); return d!==null&&d<=7; });
  const alertDiv = document.getElementById('dash-alert');
  if (vencendo.length) {
    alertDiv.style.display='block';
    document.getElementById('dash-alert-list').innerHTML =
      vencendo.sort((a,b)=>diasVencer(a.validade)-diasVencer(b.validade)).slice(0,5).map(i=>{
        const d=diasVencer(i.validade);
        return `<div class="dash-alert-item"><span>${i.nome}</span><span style="font-size:11px;font-family:'JetBrains Mono',monospace">${d<=0?'VENCIDO':d+'d'}</span></div>`;
      }).join('');
  } else { alertDiv.style.display='none'; }

  const baixo = itens.filter(i=>i.minimo>0&&i.saldo<i.minimo);
  const lowDiv = document.getElementById('dash-low');
  if (baixo.length) {
    lowDiv.style.display='block';
    document.getElementById('dash-low-list').innerHTML =
      baixo.slice(0,5).map(i=>
        `<div class="dash-alert-item"><span>${i.nome}</span><span style="font-size:11px;color:var(--amber);font-family:'JetBrains Mono',monospace">${i.saldo}/${i.minimo} ${i.unidade}</span></div>`
      ).join('');
  } else { lowDiv.style.display='none'; }

  document.getElementById('dash-metrics').innerHTML=`
    <div class="dash-box" onclick="switchTab('estoque')">
      <div class="dl">Produtos</div><div class="dv">${itens.length}</div><div class="ds">cadastrados</div>
    </div>
    <div class="dash-box" onclick="switchTab('estoque')">
      <div class="dl">Unidades</div><div class="dv gold">${itens.reduce((s,i)=>s+(i.saldo||0),0)}</div><div class="ds">em estoque</div>
    </div>
    <div class="dash-box" onclick="switchTab('estoque')">
      <div class="dl">Vencendo</div><div class="dv ${vencendo.length>0?'red':''}">${vencendo.length}</div><div class="ds">em 7 dias</div>
    </div>
    <div class="dash-box" onclick="switchTab('estoque')">
      <div class="dl">Estoque baixo</div><div class="dv ${baixo.length>0?'amber':''}">${baixo.length}</div><div class="ds">abaixo mínimo</div>
    </div>`;

  db.ref('logs/'+dataLocal()).once('value').then(snap=>{
    const cont=document.getElementById('dash-recent');
    if(!snap.exists()){ cont.innerHTML='<div class="empty">Nenhuma movimentação hoje.</div>'; return; }
    const logs=[]; snap.forEach(l=>{ if(l.val()) logs.push(l.val()); }); logs.reverse();
    cont.innerHTML=logs.slice(0,6).map(log=>{
      const ent=log.tipo==='ENTRADA';
      return `<div class="recent-log">
        <div>
          <div class="recent-log-nome">${ent?'📥':'📤'} ${log.nome||log.code}</div>
          <div class="recent-log-hora">${log.hora||''} · ${log.usuario?(usuariosCache[log.usuario]||log.usuario.split('@')[0]):''}${log.obs?' · '+log.obs.substring(0,25):''}</div>
        </div>
        <span class="badge ${ent?'b-green':'b-red'}">${ent?'+':'-'}${log.qtd} ${log.unidade||'un'}</span>
      </div>`;
    }).join('')||'<div class="empty">Nenhuma movimentação hoje.</div>';
  });
}

