// events.js — Wiring de eventos DOM

// ══════════════════════════════════════════════════════════
// DOM READY — wire all events
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // Theme
  document.getElementById('theme-btn').addEventListener('click', ()=>{
    darkMode=!darkMode;
    document.body.classList.toggle('light',!darkMode);
    document.getElementById('theme-btn').textContent=darkMode?'🌙':'☀️';
    localStorage.setItem('tema',darkMode?'dark':'light');
  });

  // Login / logout
  document.getElementById('inp-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') login(); });
  document.getElementById('btn-login').addEventListener('click', login);
  // Logout
  document.getElementById('btn-nav-logout').addEventListener('click', () => {
    auth.signOut().then(() => {
      document.getElementById('inp-email').value = '';
      document.getElementById('inp-pass').value  = '';
      document.getElementById('login-error').style.display = 'none';
      document.getElementById('reset-panel').style.display = 'none';
    });
  });

  document.getElementById('btn-forgot').addEventListener('click', ()=>{
    const p=document.getElementById('reset-panel');
    p.style.display = p.style.display==='none'||!p.style.display ? 'block' : 'none';
  });

  // Nav
  document.querySelectorAll('.nav-item[data-tab]').forEach(el=>{
    el.addEventListener('click',()=>switchTab(el.dataset.tab));
  });

  // Operações
  document.getElementById('btn-entrada').addEventListener('click',()=>processar('ENTRADA'));
  document.getElementById('btn-saida').addEventListener('click',()=>processarSaida());

  // QR
  document.getElementById('qr-toggle-entrada').addEventListener('click',()=>toggleQR('entrada'));
  document.getElementById('qr-toggle-saida').addEventListener('click',()=>toggleQR('saida'));

  // Autocomplete
  const saiBusca=document.getElementById('sai-busca');
  saiBusca.addEventListener('input',onSaiBuscaInput);
  saiBusca.addEventListener('keydown',onSaiBuscaKeydown);
  saiBusca.addEventListener('blur',()=>setTimeout(()=>{document.getElementById('ac-list').style.display='none';},180));

  // Estoque
  document.getElementById('filtro-estoque').addEventListener('input',renderEstoque);
  document.querySelectorAll('.tab-btn[data-estoque-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      switchEstoqueTab(btn.dataset.estoqueTab);
    });
  });

  // Export CSV
  document.getElementById('btn-export-csv').addEventListener('click',exportarEstoqueCSV);
  document.getElementById('btn-export-diario').addEventListener('click',exportarDiarioXLSX);
  document.getElementById('btn-export-completo').addEventListener('click',exportarBackupCompleto);

  // Diário
  document.getElementById('data-diario').addEventListener('change',renderDiario);

  // Relatório período
  document.querySelectorAll('.pt[data-period]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      relPeriod=btn.dataset.period;
      document.querySelectorAll('.pt').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderRelatorio();
    });
  });

  // Modal editar produto
  document.getElementById('btn-modal-close').addEventListener('click',fecharModal);
  document.getElementById('btn-modal-cancel').addEventListener('click',fecharModal);
  document.getElementById('btn-modal-save').addEventListener('click',salvarEdicao);
  document.getElementById('edit-modal').addEventListener('click',e=>{if(e.target===document.getElementById('edit-modal'))fecharModal();});
  document.getElementById('btn-ver-historico').addEventListener('click',()=>{if(editCode)abrirHistorico(editCode);});

  // Delegação edit btn nas tabelas
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-edit-code]');
    if(btn) abrirEditar(btn.dataset.editCode);
  });

  // Modal confirmar saída
  document.getElementById('btn-confirm-close').addEventListener('click',fecharConfirm);
  document.getElementById('btn-confirm-cancel').addEventListener('click',fecharConfirm);
  document.getElementById('btn-confirm-ok').addEventListener('click',()=>{ const fn=confirmCallback; fecharConfirm(); if(fn) fn(); });
  document.getElementById('confirm-modal').addEventListener('click',e=>{if(e.target===document.getElementById('confirm-modal'))fecharConfirm();});

  // Modal histórico
  document.getElementById('btn-hist-close').addEventListener('click',()=>document.getElementById('hist-modal').classList.remove('open'));
  document.getElementById('hist-modal').addEventListener('click',e=>{if(e.target===document.getElementById('hist-modal'))document.getElementById('hist-modal').classList.remove('open');});

  // Modal resetar senha
  document.getElementById('btn-passwd-close').addEventListener('click',()=>document.getElementById('passwd-modal').classList.remove('open'));
  document.getElementById('passwd-modal').addEventListener('click',e=>{if(e.target===document.getElementById('passwd-modal'))document.getElementById('passwd-modal').classList.remove('open');});
  document.getElementById('btn-passwd-save').addEventListener('click',salvarSenhaAdmin);

  // Usuários
  document.getElementById('btn-criar-usuario').addEventListener('click',criarUsuario);

  // Timeout de inatividade — logout automático após 8h
  let inactivityTimer;
  function resetTimer(){
    clearTimeout(inactivityTimer);
    inactivityTimer=setTimeout(()=>{
      toast('Sessão encerrada por inatividade.','warn');
      setTimeout(()=>auth.signOut(),2000);
    }, 8*60*60*1000);
  }
  ['click','keydown','touchstart'].forEach(e=>document.addEventListener(e,resetTimer,{passive:true}));
  resetTimer();
});

