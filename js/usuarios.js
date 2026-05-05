// usuarios.js — Gestão de usuários

// ══════════════════════════════════════════════════════════
// USUÁRIOS (gerenciamento via Firebase Auth + DB)
// ══════════════════════════════════════════════════════════
function renderUsuarios() {
  if(!podeAcessar('ADMIN')) return;
  db.ref('config/usuarios').once('value').then(snap=>{
    const cont=document.getElementById('lista-usuarios');
    if(!snap.exists()){ cont.innerHTML='<div class="empty">Nenhum usuário.</div>'; return; }
    let html='';
    snap.forEach(u=>{
      const uid=u.key, ud=u.val(), ativo=ud.ativo!==false, isMe=currentUser&&uid===currentUser.uid;
      html+=`<div class="user-item">
        <div>
          <div class="user-name">${ud.nome||ud.email||uid} ${isMe?'<span style="font-size:10px;color:var(--muted)">(você)</span>':''}</div>
          <div class="user-level">${nivelLabel(ud.nivel||'OPERADOR')} <span style="font-size:11px;color:var(--muted)">${ud.email||''}</span> ${ativo?'':'<span class="badge b-red" style="font-size:9px">INATIVO</span>'}</div>
        </div>
        <div class="user-actions">
          ${!isMe?`<button class="btn btn-ghost btn-sm" onclick="toggleAtivoUsuario('${uid}',${ativo},'${ud.email||''}')">${ativo?'🚫':'✅'}</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="abrirTrocarSenha('${uid}','${ud.email||''}')">🔑</button>
          ${!isMe?`<button class="btn btn-sm" style="background:var(--red-dim);border:1px solid rgba(224,82,82,.3);color:var(--red)" onclick="confirmarApagarUsuario('${uid}','${ud.nome||ud.email||uid}')">🗑️</button>`:''}
        </div>
      </div>`;
    });
    cont.innerHTML=html;
  });
}

function criarUsuario() {
  if(!podeAcessar('ADMIN')){ toast('Acesso negado.','err'); return; }
  const nome  = document.getElementById('new-user-nome').value.trim();
  const email = document.getElementById('new-user-login').value.trim().toLowerCase();
  const pass  = document.getElementById('new-user-pass').value;
  const nivel = document.getElementById('new-user-nivel').value;
  if(!nome){ toast('Informe o nome do usuário.','err'); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast('Email inválido.','err'); return; }
  if(pass.length<6){ toast('Senha mínimo 6 caracteres.','err'); return; }

  // Usa secondary app isolado para não disparar o onAuthStateChanged principal
  const secAppName = 'sec_'+Date.now();
  const secondaryApp = firebase.initializeApp(firebaseConfig, secAppName);
  const secAuth = secondaryApp.auth();

  secAuth.createUserWithEmailAndPassword(email, pass)
    .then(cred=>{
      const uid=cred.user.uid;
      return db.ref('config/usuarios/'+uid).set({
        nome, email, nivel, ativo:true,
        criadoPor: currentUser?currentUser.email:'',
        criadoEm: Date.now()
      }).then(()=>{
        // Desloga e destrói o secondary ANTES de qualquer outra ação
        return secAuth.signOut().then(()=>secondaryApp.delete());
      }).then(()=>{
        toast('✅ Usuário criado: '+nome);
        document.getElementById('new-user-nome').value='';
        document.getElementById('new-user-login').value='';
        document.getElementById('new-user-pass').value='';
        renderUsuarios();
        db.ref('auditoria/usuarios').push({acao:'criar',nome,email,nivel,feito_por:currentUser?currentUser.email:'',ts:Date.now()});
      });
    })
    .catch(err=>{
      secAuth.signOut().catch(()=>{});
      secondaryApp.delete().catch(()=>{});
      const msg = err.code==='auth/email-already-in-use'
        ? 'Email já cadastrado. Se excluiu recentemente, apague também em Firebase Console → Authentication → Users.'
        : 'Erro: '+err.message;
      toast(msg,'err');
    });
}

function toggleAtivoUsuario(uid, ativoAtual, email) {
  if(!podeAcessar('ADMIN')){ toast('Acesso negado.','err'); return; }
  if(currentUser&&uid===currentUser.uid){ toast('Não pode inativar a si mesmo.','err'); return; }
  db.ref('config/usuarios/'+uid).update({ativo:!ativoAtual}).then(()=>{
    toast(ativoAtual?'🚫 Usuário inativado.':'✅ Usuário ativado.');
    renderUsuarios();
    db.ref('auditoria/usuarios').push({acao:ativoAtual?'inativar':'ativar',email,feito_por:currentUser?currentUser.email:'',ts:Date.now()});
  }).catch(err=>toast('Erro: '+err.code,'err'));
}

function abrirTrocarSenha(uid, email) {
  passwdTargetUid={uid,email};
  document.getElementById('passwd-user-label').textContent='Alterando senha de: '+email;
  document.getElementById('passwd-new').value='';
  document.getElementById('passwd-confirm').value='';
  document.getElementById('passwd-modal').classList.add('open');
}

function salvarSenhaAdmin() {
  if(!passwdTargetUid) return;
  if(!podeAcessar('ADMIN')){ toast('Acesso negado.','err'); return; }
  const nova=document.getElementById('passwd-new').value;
  const conf=document.getElementById('passwd-confirm').value;
  if(nova.length<6){ toast('Mínimo 6 caracteres.','err'); return; }
  if(nova!==conf){ toast('Senhas não conferem.','err'); return; }
  // Troca via secondary app
  const secApp=firebase.initializeApp(firebaseConfig,'pw_'+Date.now());
  // Não temos a senha atual do usuário para re-autenticar via client SDK.
  // Solução: salva nova senha no DB como pendente e força no próximo login.
  // Para segurança real use Firebase Admin SDK (Cloud Functions).
  // Por ora marcamos senha_pendente no perfil — o usuário faz reset ao logar.
  db.ref('config/usuarios/'+passwdTargetUid.uid).update({
    senha_reset_pendente: true,
    nova_senha_hash: btoa(nova), // Base64 simples — apenas para comunicação interna
    reset_solicitado_por: currentUser?currentUser.email:'',
    reset_ts: Date.now()
  }).then(()=>{
    secApp.delete().catch(()=>{});
    toast('✅ Reset de senha solicitado. Usuário será notificado.');
    document.getElementById('passwd-modal').classList.remove('open');
    db.ref('auditoria/usuarios').push({acao:'reset_senha',email:passwdTargetUid.email,feito_por:currentUser?currentUser.email:'',ts:Date.now()});
  }).catch(err=>{ secApp.delete().catch(()=>{}); toast('Erro: '+err.code,'err'); });
}

// ══════════════════════════════════════════════════════════
// APAGAR USUÁRIO
// ══════════════════════════════════════════════════════════
function confirmarApagarUsuario(uid, nome) {
  if (!podeAcessar('ADMIN')) { toast('Acesso negado.', 'err'); return; }
  if (currentUser && uid === currentUser.uid) { toast('Não pode apagar a si mesmo.', 'err'); return; }

  // Busca o email do usuário para mostrar na confirmação
  db.ref('config/usuarios/' + uid + '/email').once('value').then(snap => {
    const email = snap.val() || '';
    document.getElementById('confirm-nome').textContent = nome;
    document.getElementById('confirm-det').textContent  = email;
    document.getElementById('confirm-msg').textContent  = '⚠️ O acesso será bloqueado imediatamente. Para reusar este email no futuro, apague também em Firebase Console → Authentication.';
    document.getElementById('confirm-modal').classList.add('open');
    confirmCallback = () => apagarUsuario(uid, nome);
  });
}

function apagarUsuario(uid, nome) {
  // 1. Remove perfil do Realtime Database
  db.ref('config/usuarios/' + uid).remove()
    .then(() => {
      toast('🗑️ Usuário removido: ' + nome);
      renderUsuarios();
      db.ref('auditoria/usuarios').push({
        acao: 'apagar', uid, nome,
        feito_por: currentUser ? currentUser.email : '',
        ts: Date.now()
      });
    })
    .catch(err => toast('Erro ao apagar do banco: ' + err.code, 'err'));

  // 2. Apaga do Firebase Authentication usando secondary app
  // O Admin cria uma instância secundária, mas não conseguimos deletar outro
  // usuário sem o Admin SDK. A solução client-side é desabilitar no DB (ativo:false)
  // Para recriar o mesmo email: vá em Firebase Console → Authentication → apague manualmente.
  // Ou use esta função que tenta apagar via secondary app sign-in (só funciona se souber a senha):
  // db.ref('config/usuarios/' + uid + '/email') para pegar o email e tentar deletar.
  // NOTA: sem a senha do usuário não é possível deletar do Auth via client SDK.
  // A remoção do DB já barra o acesso imediatamente.
}

// Função auxiliar para recriar usuário com mesmo email após exclusão manual no Firebase Console
// Acesse: https://console.firebase.google.com → Authentication → Users → encontre o email → delete
function instrucaoRecriarUsuario(email) {
  toast('Para reusar este email: apague em Firebase Console → Authentication → Users', 'warn');
  console.info('Recriar usuário: Firebase Console → Authentication → Users → delete ' + email);
}

// ══════════════════════════════════════════════════════════
// RECIBO (Operador)
// ══════════════════════════════════════════════════════════
function mostrarRecibo(nome, qtd, unidade, obs, novoSaldo) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const data = new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  document.getElementById('recibo-content').innerHTML = `
    <div class="recibo-row">
      <span class="recibo-label">Produto</span>
      <span class="recibo-val">${nome}</span>
    </div>
    <div class="recibo-row">
      <span class="recibo-label">Quantidade</span>
      <span class="recibo-val" style="color:var(--red)">-${qtd} ${unidade}</span>
    </div>
    <div class="recibo-row">
      <span class="recibo-label">Finalidade</span>
      <span class="recibo-val" style="font-size:13px">${obs}</span>
    </div>
    <div class="recibo-row">
      <span class="recibo-label">Saldo restante</span>
      <span class="recibo-val" style="color:${novoSaldo>0?'var(--green)':'var(--red)'}">${novoSaldo} ${unidade}</span>
    </div>
    <div class="recibo-row">
      <span class="recibo-label">Horário</span>
      <span class="recibo-val" style="font-size:13px">${data} · ${hora}</span>
    </div>`;
  document.getElementById('recibo-box').style.display = 'block';
  // Esconde o formulário
  document.querySelector('#page-saida .card.accent-red').style.display = 'none';
  document.querySelector('#page-saida .qr-toggle').style.display = 'none';
  document.getElementById('qr-wrap-saida').style.display = 'none';
}

function fecharRecibo() {
  document.getElementById('recibo-box').style.display = 'none';
  const card = document.querySelector('#page-saida .card.accent-red');
  const toggle = document.querySelector('#page-saida .qr-toggle');
  if(card) card.style.display = '';
  if(toggle) toggle.style.display = '';
}


