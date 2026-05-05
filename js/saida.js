// saida.js — Registro de saída, confirmação e recibo

// ══════════════════════════════════════════════════════════
// PROCESSAR SAÍDA (com modal de confirmação)
// ══════════════════════════════════════════════════════════
function processarSaida() {
  const qtd=parseFloat(document.getElementById('sai-qtd').value.replace(',','.'));
  if(isNaN(qtd)||qtd<=0){ toast('Quantidade inválida.','err'); return; }

  let code=document.getElementById('sai-code').value.trim();
  if(!code){
    const busca=document.getElementById('sai-busca').value.trim().toLowerCase();
    const found=Object.entries(cache).find(([k,v])=>k.toLowerCase()===busca||(v.nome&&v.nome.toLowerCase()===busca));
    if(found){ code=found[0]; } else { toast('Selecione um produto da lista.','err'); if(busca&&cacheReady)buildAcList(busca); return; }
  }

  const item=cache[code];
  if(!item){ toast('Produto não encontrado.','err'); return; }
  if(item.saldo<qtd){ toast('Saldo insuficiente! Há apenas '+item.saldo+' '+item.unidade+'.','err'); return; }

  const obs=document.getElementById('sai-obs').value.trim();

  // Obs obrigatória para OPERADOR
  if(userLevel==='OPERADOR' && !obs){
    toast('Informe a finalidade da retirada.','err');
    document.getElementById('sai-obs').focus();
    return;
  }

  // Data: operador sempre usa hoje; supervisor/admin pode usar campo manual
  let dataManual = null;
  if(podeAcessar('SUPERVISOR')){
    const manualField = document.getElementById('sai-data-manual');
    dataManual = manualField ? manualField.value : null;
  }

  // Confirmação
  document.getElementById('confirm-nome').textContent=item.nome;
  document.getElementById('confirm-det').textContent=qtd+' '+item.unidade+' · Saldo: '+item.saldo+' '+item.unidade;
  document.getElementById('confirm-msg').textContent=obs?'Finalidade: "'+obs+'"':'Confirme a saída deste produto.';
  document.getElementById('confirm-modal').classList.add('open');

  confirmCallback=()=>gravarMovimento('SAIDA',code,null,qtd,dataManual,obs,item);
}

function fecharConfirm(){ document.getElementById('confirm-modal').classList.remove('open'); confirmCallback=null; }


// ══════════════════════════════════════════════════════════
// GRAVAR MOVIMENTO
// ══════════════════════════════════════════════════════════
function gravarMovimento(tipo,code,dadosEntrada,qtd,dataManual=null,obs='',itemRef=null) {
  if(!code||typeof code!=='string'||code.length>100){ toast('Código inválido.','err'); return; }
  db.ref('estoque/'+code).once('value').then(snap=>{
    const atual=snap.val();
    if(tipo==='SAIDA'&&!atual){ toast('Produto não existe. Código: '+code,'err'); return; }
    const base=atual||{nome:dadosEntrada.nome,saldo:0,setor:dadosEntrada.setor,validade:dadosEntrada.validade,unidade:dadosEntrada.unidade||'un',minimo:dadosEntrada.minimo||0};
    const novoSaldo=tipo==='ENTRADA'?base.saldo+qtd:base.saldo-qtd;
    if(novoSaldo<0){ toast('Saldo insuficiente!','err'); return; }
    const novosDados={
      nome:     tipo==='ENTRADA'?dadosEntrada.nome    :(base.nome||''),
      saldo:    novoSaldo,
      setor:    tipo==='ENTRADA'?dadosEntrada.setor   :(base.setor||'SECO'),
      validade: tipo==='ENTRADA'?dadosEntrada.validade:(base.validade||''),
      unidade:  tipo==='ENTRADA'?dadosEntrada.unidade :(base.unidade||'un'),
      minimo:   tipo==='ENTRADA'?(dadosEntrada.minimo||0):(base.minimo||0)
    };
    const dataLog=dataManual||dataLocal();
    const logEntry={
      tipo, code, nome:novosDados.nome, qtd,
      unidade:novosDados.unidade||'un',
      hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      usuario: currentUser ? currentUser.email : 'desconhecido'
    };
    if(obs) logEntry.obs=obs;
    const updates={};
    updates['estoque/'+code]=novosDados;
    updates['logs/'+dataLog+'/'+Date.now()]=logEntry;
    db.ref().update(updates).then(()=>{
      toast(tipo==='ENTRADA'?'✅ Entrada registrada!':'✅ Saída registrada!');
      if(tipo==='SAIDA'&&novosDados.minimo>0&&novoSaldo<novosDados.minimo)
        setTimeout(()=>toast('⚠️ '+novosDados.nome+' abaixo do mínimo!','warn'),600);
      if(tipo==='ENTRADA'){
        ['ent-code','ent-nome','ent-val','ent-obs'].forEach(id=>document.getElementById(id).value='');
        document.getElementById('ent-qtd').value=1; document.getElementById('ent-unidade').value='un'; document.getElementById('ent-minimo').value=0;
      } else {
        ['sai-code','sai-busca','sai-obs'].forEach(id=>document.getElementById(id).value='');
        const saiDataManual = document.getElementById('sai-data-manual');
        if(saiDataManual) saiDataManual.value='';
        document.getElementById('sai-qtd').value=1;
        document.getElementById('sai-preview-box').style.display='none';
        // Recibo para operador
        if(userLevel==='OPERADOR') mostrarRecibo(novosDados.nome, qtd, novosDados.unidade, obs, novoSaldo);
      }
      if(document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
    }).catch(err=>{ console.error(err); toast('Erro: '+(err.code||err.message),'err'); });
  }).catch(err=>{ console.error(err); toast('Erro: '+(err.message||'Desconhecido'),'err'); });
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
