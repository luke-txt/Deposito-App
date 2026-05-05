// config.js — Firebase, App Check e níveis de acesso

// ══════════════════════════════════════════════════════════
// FIREBASE CONFIG + INIT
// ══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyA-2SH_h57k24EKQXLjOkWsrs70tbSbFGE",
  authDomain:        "depositorancho-43b21.firebaseapp.com",
  databaseURL:       "https://depositorancho-43b21-default-rtdb.firebaseio.com",
  projectId:         "depositorancho-43b21",
  storageBucket:     "depositorancho-43b21.firebasestorage.app",
  messagingSenderId: "883363350930",
  appId:             "1:883363350930:web:3da976d452d26837ef994b"
};
firebase.initializeApp(firebaseConfig);
const db   = firebase.database();
const auth = firebase.auth();

// App Check — só bloqueia requisições sem token válido do reCAPTCHA
// O token é gerado automaticamente pelo Google no domínio autorizado
const appCheck = firebase.appCheck();
appCheck.activate(
  new firebase.appCheck.ReCaptchaV3Provider('6Lc81NcsAAAAANKyCFJ-QrBnv-kBN0wlMa8E4dkw'),
  true
);

// App Check — ativado só após registrar o app no Firebase Console → App Check → Apps
// Descomente as linhas abaixo DEPOIS de registrar o app:
// const appCheck = firebase.appCheck();
// appCheck.activate(
//   new firebase.appCheck.ReCaptchaV3Provider('6Lc81NcsAAAAANKyCFJ-QrBnv-kBN0wlMa8E4dkw'),
//   true
// );


// ══════════════════════════════════════════════════════════
// NÍVEIS  OPERADOR < SUPERVISOR < ADMIN
// ══════════════════════════════════════════════════════════
const NIVEL = { OPERADOR:1, SUPERVISOR:2, ADMIN:3 };
function podeAcessar(n){ return (NIVEL[userLevel]||0) >= (NIVEL[n]||99); }

