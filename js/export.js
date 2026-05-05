// export.js — Exportação CSV e XLSX

// ══════════════════════════════════════════════════════════
// EXPORT CSV
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// EXPORTS — CSV e XLSX
// ══════════════════════════════════════════════════════════

function exportarEstoqueCSV() {
  const rows=[['Código','Nome','Setor','Saldo','Unidade','Validade','Mínimo']];
  Object.entries(cache).sort((a,b)=>(a[1].nome||'').localeCompare(b[1].nome||'')).forEach(([code,item])=>{
    rows.push([code,item.nome,item.setor,item.saldo,item.unidade||'un',item.validade||'',item.minimo||0]);
  });
  baixarCSV(rows,'estoque_'+dataLocal()+'.csv');
}

function baixarCSV(rows,filename) {
  const BOM='\uFEFF';
  const csv=BOM+rows.map(r=>r.map(cel=>'"'+String(cel).replace(/"/g,'""')+'"').join(';')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
  toast('\u{1F4E5} Exportado!');
}

function xlsxHeaderStyle(){
  return { font:{bold:true,color:{rgb:'FFFFFFFF'}}, fill:{fgColor:{rgb:'FF1a201a'}}, alignment:{horizontal:'center'} };
}

function aplicarEstiloAba(ws, headers) {
  ws['!cols'] = headers.map(h=>({wch:Math.max(h.length+4,14)}));
  headers.forEach((_,ci)=>{
    const addr=XLSX.utils.encode_cell({r:0,c:ci});
    if(ws[addr]) ws[addr].s = xlsxHeaderStyle();
  });
}

function exportarDiarioXLSX() {
  if(!diarioSnap||!diarioSnap.exists()){ toast('Nenhum dado para exportar.','warn'); return; }
  const data=document.getElementById('data-diario').value;
  const headers=['Hora','Tipo','Produto','Código','Qtd','Unidade','Usuário','Finalidade'];
  const rows=[];
  diarioSnap.forEach(l=>{
    const v=l.val(); if(!v) return;
    const nomeUser=usuariosCache[v.usuario]||(v.usuario?v.usuario.split('@')[0]:'');
    rows.push([v.hora||'',v.tipo,v.nome||'',v.code||'',v.qtd,v.unidade||'un',nomeUser,v.obs||'']);
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
  aplicarEstiloAba(ws,headers);
  const [y,m,d]=data.split('-');
  XLSX.utils.book_append_sheet(wb,ws,d+'.'+m+'.'+y);
  XLSX.writeFile(wb,'diario_'+data+'.xlsx');
  toast('📥 XLSX exportado!');
}

async function exportarBackupCompleto() {
  if(!podeAcessar('ADMIN')){ toast('Acesso negado.','err'); return; }
  toast('⏳ Gerando backup — aguarde...','warn');

  const wb=XLSX.utils.book_new();

  // Aba 1 — Estoque atual
  const estoqueHeaders=['Código','Nome','Setor','Saldo','Unidade','Validade','Mínimo'];
  const estoqueRows=Object.entries(cache).sort((a,b)=>(a[1].nome||'').localeCompare(b[1].nome||'')).map(([code,item])=>[code,item.nome,item.setor,item.saldo,item.unidade||'un',item.validade||'',item.minimo||0]);
  const wsEstoque=XLSX.utils.aoa_to_sheet([estoqueHeaders,...estoqueRows]);
  aplicarEstiloAba(wsEstoque,estoqueHeaders);
  XLSX.utils.book_append_sheet(wb,wsEstoque,'Estoque Atual');

  // Coleta logs de 365 dias
  const logHeaders=['Hora','Tipo','Produto','Código','Qtd','Unidade','Usuário','Finalidade'];
  const diasPorData={};
  const proms=[];
  for(let i=0;i<365;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    const key=dataLocal(d);
    proms.push(db.ref('logs/'+key).once('value').then(snap=>({key,snap})));
  }
  const results=await Promise.all(proms);
  results.forEach(({key,snap})=>{
    if(!snap.exists()) return;
    const rows=[];
    snap.forEach(l=>{
      const v=l.val(); if(!v) return;
      const nomeUser=usuariosCache[v.usuario]||(v.usuario?v.usuario.split('@')[0]:'');
      rows.push([v.hora||'',v.tipo,v.nome||'',v.code||'',v.qtd,v.unidade||'un',nomeUser,v.obs||'']);
    });
    if(rows.length) diasPorData[key]=rows;
  });

  // Uma aba por data
  const datas=Object.keys(diasPorData).sort().reverse();
  datas.forEach(data=>{
    const ws=XLSX.utils.aoa_to_sheet([logHeaders,...diasPorData[data]]);
    aplicarEstiloAba(ws,logHeaders);
    const [y,m,d]=data.split('-');
    XLSX.utils.book_append_sheet(wb,ws,d+'.'+m+'.'+y);
  });

  // Aba resumo de saídas
  const resumoHeaders=['Produto','Total Saído','Unidade','Dias c/ Movimentação'];
  const resumoMap={};
  datas.forEach(data=>{
    diasPorData[data].forEach(row=>{
      if(row[1]!=='SAIDA') return;
      const nome=row[2], unid=row[5];
      if(!resumoMap[nome]) resumoMap[nome]={qtd:0,unidade:unid,dias:new Set()};
      resumoMap[nome].qtd+=Number(row[4])||0;
      resumoMap[nome].dias.add(data);
    });
  });
  const resumoRows=Object.entries(resumoMap).sort((a,b)=>b[1].qtd-a[1].qtd).map(([nome,v])=>[nome,v.qtd,v.unidade,v.dias.size]);
  if(resumoRows.length){
    const wsResumo=XLSX.utils.aoa_to_sheet([resumoHeaders,...resumoRows]);
    aplicarEstiloAba(wsResumo,resumoHeaders);
    XLSX.utils.book_append_sheet(wb,wsResumo,'Resumo Saídas');
  }

  XLSX.writeFile(wb,'backup_deposito_'+dataLocal()+'.xlsx');
  toast('✅ Backup gerado — '+datas.length+' dias de dados!');
}

