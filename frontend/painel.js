const grid=document.getElementById('grid');
function parseRange(turno){const m=String(turno).match(/(\d{2})h[^\d]+(\d{2})h/);return m?{start:+m[1],end:+m[2]}:null}
function isCurrent(turno,now){const r=parseRange(turno);if(!r)return false;const h=now.getHours()+now.getMinutes()/60;return h>=r.start&&h<r.end}
function isPast(turno,now){const r=parseRange(turno);if(!r)return false;return now.getHours()+now.getMinutes()/60>=r.end}
function activeToday(spec,now){return ESPECIALIDADES[spec].dias.includes(now.getDay())}
function statusLabel(s){return s==='APROVADO'?'<span class="status approved">Aprovado</span>':'<span class="status pending">Pendente</span>'}
async function loadPanel(){
 const now=new Date(),date=ymd(now); document.getElementById('today').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
 let all=[]; try{ if(DEMO){all=(await demoApi({acao:'listar'})).data}else{const r=await request({acao:'painelHoje',data:date});all=r.data||[];} }catch(e){grid.innerHTML='<section class="card"><b>Não foi possível carregar o painel.</b><br>'+esc(e.message)+'</section>';return}
 const today=all.filter(x=>x.data===date&&!['CANCELADO','REMOVIDO'].includes(x.status)); let current=0;
 grid.innerHTML=Object.keys(ESPECIALIDADES).map(spec=>{
   const conf=ESPECIALIDADES[spec]; if(!activeToday(spec,now))return `<section class="spec-card"><div class="spec-head"><h3>${esc(spec)}</h3></div><div class="closed">Sem estágio desta especialidade hoje.</div></section>`;
   const shifts=conf.turnos.map(turno=>{const regs=today.filter(x=>x.especialidade===spec&&x.turno===turno);const cur=isCurrent(turno,now);if(cur)current+=regs.length;const cls=cur?'current':(isPast(turno,now)?'past':'');return `<div class="shift ${cls}"><div class="shift-title"><strong>${esc(turno)}</strong>${cur?'<span class="live">AGORA</span>':''}</div><div class="students">${regs.length?regs.map(x=>`<div class="student"><div><strong>${esc(x.nome)}</strong><small>Matrícula ${esc(x.matricula)}</small></div>${statusLabel(x.status)}</div>`).join(''):'<div class="empty">Nenhum aluno agendado neste período.</div>'}</div></div>`}).join('');
   return `<section class="spec-card"><div class="spec-head"><h3>${esc(spec)}</h3></div>${shifts}</section>`;
 }).join('');
 document.getElementById('currentCount').textContent=current+' '+(current===1?'estagiário':'estagiários')+' no período atual'; document.getElementById('dayCount').textContent=today.length+' '+(today.length===1?'agendamento':'agendamentos')+' hoje';
}
function tick(){document.getElementById('clock').textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
tick();loadPanel();setInterval(tick,1000);setInterval(loadPanel,60000);
