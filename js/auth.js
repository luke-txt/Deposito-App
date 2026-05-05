// auth.js — Autenticação Firebase, login, logout e níveis

// ══════════════════════════════════════════════════════════
// FIREBASE AUTH — observer (único ponto de entrada)
// ══════════════════════════════════════════════════════════
// Timeout de segurança — se Firebase não responder em 10s, mostra login
const authTimeout = setTimeout(() => {
  const loading = document.getElementById('auth-loading');
  if (loading && loading.style.display !== 'none') {
    loading.style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }
}, 10000);

// Flag para processar o observer só uma vez
let authResolved = false;

// Aguarda token do App Check antes de iniciar o observer de auth
appCheck.getToken(true)
  .catch(() => {}) // Se falhar, continua mesmo assim
  .finally(() => {

auth.onAuthStateChanged(async firebaseUser => {
  // Ignora disparos do secondary app (criarUsuario/resetSenha)
  // e disparos repetidos após já ter resolvido
  if (authResolved && firebaseUser && currentUser) return;
  if (authResolved && !firebaseUser) {
    // Logout real — limpa tudo
    authResolved = false;
  }

  clearTimeout(authTimeout);
  const loading = document.getElementById('auth-loading');
  const loginScreen = document.getElementById('login-screen');

  if (!firebaseUser) {
    // Não autenticado — mostra login
    loading.style.display = 'none';
    loginScreen.style.display = 'flex';
    document.getElementById('main-nav').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('theme-btn').style.display = 'none';
    // Limpa cache ao deslogar
    if (cacheUnsub) { cacheUnsub(); cacheUnsub=null; }
    cache={};  cacheReady=false;
    userLevel=null; currentUser=null;
    return;
  }

  // Autenticado — busca perfil no Realtime DB (uid como chave)
  try {
    const snap = await db.ref('config/usuarios/'+firebaseUser.uid).once('value');
    const perfil = snap.val();

    if (!perfil || perfil.ativo === false) {
      // Usuário não tem perfil ou foi inativado — nega acesso
      await auth.signOut();
      mostrarErroLogin('Acesso negado. Conta inativa ou não cadastrada.');
      return;
    }

    userLevel  = perfil.nivel || 'OPERADOR';
    currentUser = {
      uid:   firebaseUser.uid,
      email: firebaseUser.email,
      nome:  perfil.nome || firebaseUser.email.split('@')[0],
      nomeCompleto: perfil.nome || firebaseUser.email.split('@')[0]
    };

    // Registra login na auditoria
    db.ref('auditoria/login_ok').push({
      uid: currentUser.uid, email: currentUser.email,
      nivel: userLevel, ts: Date.now()
    });

    // Mostra app
    loading.style.display = 'none';
    loginScreen.style.display = 'none';
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('app').style.display = 'block';
    const tb = document.getElementById('theme-btn');
    tb.style.display = 'flex';
    tb.textContent = darkMode ? '🌙' : '☀️';

    authResolved = true;
    aplicarNivel();
    carregarCache();
    switchTab(userLevel === 'OPERADOR' ? 'saida' : 'dashboard');

  } catch(err) {
    console.error('Auth state error:', err);
    await auth.signOut();
    mostrarErroLogin('Erro ao verificar perfil: '+err.message);
  }
});
}); // fim appCheck.getToken


// ══════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════
let loginAttempts = 0;
let loginBloqueado = false;

function mostrarErroLogin(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('auth-loading').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

function login() {
  if (loginBloqueado) { toast('Aguarde antes de tentar novamente.','err'); return; }

  const email = document.getElementById('inp-email').value.trim().toLowerCase();
  const pass  = document.getElementById('inp-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  if (!email || !pass) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Email inválido.'; errEl.style.display='block'; return;
  }

  // Mostra spinner durante autenticação
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('auth-loading').style.display = 'flex';

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => { loginAttempts = 0; })
    .catch(err => {
      loginAttempts++;
      if (loginAttempts >= 5) {
        loginBloqueado = true;
        setTimeout(()=>{ loginBloqueado=false; loginAttempts=0; }, 30000);
        mostrarErroLogin('Bloqueado por 30s após 5 tentativas.');
      } else {
        const msg = err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? `Email ou senha incorretos. (${loginAttempts}/5)`
          : 'Erro: ' + err.message;
        mostrarErroLogin(msg);
      }
      // Auditoria de tentativa falha
      db.ref('auditoria/login_falha').push({ email, ts: Date.now(), tentativa: loginAttempts });
    });
}


// ══════════════════════════════════════════════════════════
// NÍVEL DE ACESSO
// ══════════════════════════════════════════════════════════
function aplicarNivel() {
  document.querySelectorAll('.level-entrada').forEach(el=>{
    el.style.display = podeAcessar('SUPERVISOR') ? '' : 'none';
  });
  document.querySelectorAll('.level-admin').forEach(el=>{
    el.style.display = podeAcessar('ADMIN') ? '' : 'none';
  });

  if (userLevel === 'OPERADOR') {
    // Modo operador — nav limpa, só Saída
    document.body.classList.add('modo-operador');
    // Esconde todos os nav items exceto Saída e Logout
    document.querySelectorAll('.nav-item[data-tab]').forEach(el => {
      el.style.display = el.dataset.tab === 'saida' ? '' : 'none';
    });
    document.querySelector('.nav-logo').style.display = 'none';
  } else {
    document.body.classList.remove('modo-operador');
    // Supervisor vê campo de data manual na saída
    const dataField = document.getElementById('sai-data-field');
    if (dataField) dataField.style.display = '';
    // Observação não obrigatória para supervisor/admin
    const obsRequired = document.getElementById('sai-obs-required');
    if (obsRequired) obsRequired.style.display = 'none';
  }
}

