// cache.js — Cache do estoque e badge de alertas

// ══════════════════════════════════════════════════════════
// CACHE REALTIME
// ══════════════════════════════════════════════════════════
function carregarCache() {
  // Carrega nomes dos usuários para exibir no diário
  db.ref('config/usuarios').once('value').then(snap => {
    snap.forEach(u => {
      const v = u.val();
      if (v && v.email) usuariosCache[v.email] = v.nome || v.email.split('@')[0];
    });
  });

  if (cacheUnsub) cacheUnsub();
  const ref = db.ref('estoque');
  const handler = snap => {
    cache = {};
    snap.forEach(c => {
      const v=c.val(); if(!v) return;
      cache[c.key] = {
        nome:    v.nome    || c.key,
        saldo:   Number(v.saldo)   || 0,
        setor:   v.setor   || 'SECO',
        validade:v.validade|| '',
        unidade: v.unidade || 'un',
        minimo:  Number(v.minimo)  || 0
      };
    });
    cacheReady = true;
    atualizarBadgeNav();
    if (document.getElementById('page-estoque').classList.contains('active'))   renderEstoque();
    if (document.getElementById('page-relatorio').classList.contains('active')) renderRelatorio();
    if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
  };
  ref.on('value', handler, err=>{ console.error('[Cache]',err); toast('Erro Firebase: '+err.code,'err'); });
  cacheUnsub = () => ref.off('value', handler);
}


// ══════════════════════════════════════════════════════════
// BADGE ALERTA NAV
// ══════════════════════════════════════════════════════════
function atualizarBadgeNav() {
  const temAlerta = Object.values(cache).some(i=>{
    const d=diasVencer(i.validade);
    return (d!==null&&d<=7) || (i.minimo>0&&i.saldo<i.minimo);
  });
  document.getElementById('nav-badge-estoque').style.display = temAlerta ? 'block' : 'none';
}

