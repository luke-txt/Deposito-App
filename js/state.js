// state.js — Variáveis globais de estado

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let userLevel   = null;
let currentUser = null;   // { uid, email, displayName }
let cache       = {};
let cacheReady  = false;
let cacheUnsub  = null;
let usuariosCache = {}; // { email: nome }
let qrInst={}, qrOn={};
let acItems=[], acIdx=-1;
let editCode=null;
let relPeriod='semana';
let estoqueTabAtual='lista';
let confirmCallback=null;
let passwdTargetUid=null;
let darkMode = localStorage.getItem('tema') !== 'light';

