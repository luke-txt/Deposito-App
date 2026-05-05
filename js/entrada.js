// entrada.js — Registro de entrada de produtos

// ══════════════════════════════════════════════════════════
// PROCESSAR ENTRADA
// ══════════════════════════════════════════════════════════
function processar(tipo) {
  if(!podeAcessar('SUPERVISOR')){ toast('Acesso negado.','err'); return; }
  const qtd=parseFloat(document.getElementById('ent-qtd').value.replace(',','.'));
  if(isNaN(qtd)||qtd<=0){ toast('Quantidade inválida.','err'); return; }
  const code=document.getElementById('ent-code').value.trim();
  const nome=document.getElementById('ent-nome').value.trim();
  if(!code){ toast('Informe o código.','err'); return; }
  if(!nome){ toast('Informe o nome.','err'); return; }
  gravarMovimento('ENTRADA',code,{
    nome, setor:document.getElementById('ent-setor').value,
    validade:document.getElementById('ent-val').value,
    unidade:document.getElementById('ent-unidade').value,
    minimo:parseFloat(document.getElementById('ent-minimo').value)||0,
    obs:document.getElementById('ent-obs').value.trim()
  },qtd);
}

