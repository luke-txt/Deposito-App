// nav.js — Navegação entre abas

// ══════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ══════════════════════════════════════════════════════════
async function switchTab(tab) {
  // Operador só pode acessar saida
  if (userLevel === 'OPERADOR' && tab !== 'saida') {
    toast('Acesso não autorizado.','err'); return;
  }
  const permMap = { entrada:'SUPERVISOR', diario:'SUPERVISOR', relatorio:'ADMIN', usuarios:'ADMIN' };
  if (permMap[tab] && !podeAcessar(permMap[tab])) { toast('Acesso não autorizado.','err'); return; }

  for (const k of Object.keys(qrInst)) {
    if (qrOn[k]) {
      await qrInst[k].stop().catch(()=>{});
      qrOn[k]=false;
      document.getElementById('qr-wrap-'+k).style.display='none';
      document.querySelector('#qr-toggle-'+k+' span').textContent='Usar câmera / QR Code';
    }
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  const navEl=document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if(navEl) navEl.classList.add('active');

  if(tab==='dashboard') renderDashboard();
  if(tab==='estoque')   renderEstoque();
  if(tab==='diario')    { document.getElementById('data-diario').value=dataLocal(); renderDiario(); }
  if(tab==='relatorio') renderRelatorio();
  if(tab==='usuarios')  renderUsuarios();
  if(tab==='saida') {
    // Atualiza label com data atual
    const labelEl = document.getElementById('sai-data-label');
    if (labelEl) {
      const hoje = new Date();
      labelEl.textContent = hoje.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    }
    // Esconde recibo ao abrir a aba
    fecharRecibo();
  }
}

