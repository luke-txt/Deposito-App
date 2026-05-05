// qr.js — Leitor de QR Code

// ══════════════════════════════════════════════════════════
// QR
// ══════════════════════════════════════════════════════════
async function toggleQR(key) {
  const wrap=document.getElementById('qr-wrap-'+key);
  const spanEl=document.querySelector('#qr-toggle-'+key+' span');
  if(qrOn[key]){ await qrInst[key].stop().catch(()=>{}); qrOn[key]=false; wrap.style.display='none'; spanEl.textContent='Usar câmera / QR Code'; return; }
  wrap.style.display='block'; spanEl.textContent='Fechar câmera';
  if(!qrInst[key]) qrInst[key]=new Html5Qrcode('qr-reader-'+key);
  qrInst[key].start({ facingMode:'environment' }, { fps:15, qrbox:{width:250,height:180} },
    text=>{
      if(key==='entrada'){ document.getElementById('ent-code').value=text; if(cache[text]){ document.getElementById('ent-nome').value=cache[text].nome; document.getElementById('ent-setor').value=cache[text].setor; } }
      else { selecionarItem(text); }
      qrInst[key].stop().catch(()=>{}); qrOn[key]=false; wrap.style.display='none'; spanEl.textContent='Usar câmera / QR Code';
    }, ()=>{}
  ).then(()=>qrOn[key]=true).catch(()=>{ toast('Câmera indisponível','err'); wrap.style.display='none'; });
}

