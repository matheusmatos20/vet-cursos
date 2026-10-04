const API_URL='COLE_AQUI_A_URL_DO_APPS_SCRIPT_EXEC';
const ESPECIALIDADES={
 'Internação':{dias:[0,1,2,3,4,5,6],turnos:['Manhã 08h–13h','Tarde 13h–18h','Noite 18h–23h']},
 'Clínica':{dias:[0,1,2,3,4,5,6],turnos:['Manhã 08h–13h','Tarde 13h–18h','Noite 18h–23h']},
 'Imagem':{dias:[1,2,3,4,5,6],turnos:['Manhã 08h–13h','Tarde 14h–19h']},
 'Reabilita':{dias:[1,2,3,4,5],turnos:['Tarde 14h–19h']},
 'Cirurgia':{dias:[1,2,3,4,5],turnos:['Manhã 08h–13h','Tarde 13h–18h']}
};
const DEMO=API_URL.startsWith('COLE_');
function seedGestaoDemo(){
 if(!DEMO)return;
 if(!localStorage.getItem('clinvet_turmas')){
  localStorage.setItem('clinvet_turmas',JSON.stringify([
   {id:'turma-demo-1',nome:'T38 • Auxiliar Veterinário',dataInicio:'2026-11-10',dataFim:'2027-08-10',status:'ATIVA',criadoEm:'2026-10-04T12:00:00-03:00',atualizadoEm:'2026-10-04T12:00:00-03:00'},
   {id:'turma-demo-2',nome:'T39 • Auxiliar Veterinário',dataInicio:'2027-02-08',dataFim:'2027-11-08',status:'PLANEJADA',criadoEm:'2026-10-04T12:05:00-03:00',atualizadoEm:'2026-10-04T12:05:00-03:00'}
  ]));
 }
 if(!localStorage.getItem('clinvet_leads')){
  localStorage.setItem('clinvet_leads',JSON.stringify([
   {id:'lead-demo-1',nome:'Mariana Souza',telefone:'(13) 99121-4488',email:'mariana.souza@email.com',curso:'Auxiliar Veterinário',mensagem:'Gostaria de saber os horários da próxima turma.',criadoEm:'2026-10-04T09:12:00-03:00',status:'NOVO',responsavel:'',ultimoContatoEm:'',ultimoCanal:'',matricula:'',turma:''},
   {id:'lead-demo-2',nome:'Lucas Almeida',telefone:'(13) 99734-2016',email:'lucas.almeida@email.com',curso:'Auxiliar Veterinário',mensagem:'Tenho interesse na turma que começa em novembro.',criadoEm:'2026-10-03T16:40:00-03:00',status:'EM_CONTATO',responsavel:'Carla',assumidoEm:'2026-10-04T09:00:00-03:00',ultimoContatoEm:'2026-10-04T09:08:00-03:00',ultimoCanal:'WHATSAPP',matricula:'',turma:''},
   {id:'lead-demo-3',nome:'Beatriz Ferreira',telefone:'(13) 98844-7630',email:'beatriz.ferreira@email.com',curso:'Auxiliar Veterinário',mensagem:'Quero receber mais informações sobre inscrição.',criadoEm:'2026-10-02T11:15:00-03:00',status:'AGUARDANDO',responsavel:'Carla',assumidoEm:'2026-10-02T13:00:00-03:00',ultimoContatoEm:'2026-10-03T10:20:00-03:00',ultimoCanal:'LIGACAO',matricula:'',turma:''},
   {id:'lead-demo-4',nome:'Rafael Martins',telefone:'(13) 99602-1189',email:'rafael.martins@email.com',curso:'Auxiliar Veterinário',mensagem:'Gostaria de fazer a matrícula.',criadoEm:'2026-10-01T14:50:00-03:00',status:'INTERESSADO',responsavel:'Juliana',assumidoEm:'2026-10-01T15:10:00-03:00',ultimoContatoEm:'2026-10-03T15:45:00-03:00',ultimoCanal:'WHATSAPP',matricula:'',turma:''},
   {id:'lead-demo-5',nome:'Camila Rodrigues',telefone:'(13) 99218-5541',email:'camila.rodrigues@email.com',curso:'Auxiliar Veterinário',mensagem:'Quero entender valores e datas.',criadoEm:'2026-09-30T10:05:00-03:00',status:'PERDIDO',responsavel:'Juliana',assumidoEm:'2026-09-30T10:30:00-03:00',ultimoContatoEm:'2026-10-02T17:30:00-03:00',ultimoCanal:'EMAIL',motivoPerda:'Optou por outro curso neste momento.',matricula:'',turma:''}
  ]));
 }
 if(!localStorage.getItem('clinvet_contatos')){
  localStorage.setItem('clinvet_contatos',JSON.stringify([
   {id:'cont-demo-1',leadId:'lead-demo-2',criadoEm:'2026-10-04T09:00:00-03:00',responsavel:'Carla',canal:'SISTEMA',resultado:'ATENDIMENTO_ASSUMIDO',observacao:'Atendimento assumido pela recepção.',proximoFollowUp:''},
   {id:'cont-demo-2',leadId:'lead-demo-2',criadoEm:'2026-10-04T09:08:00-03:00',responsavel:'Carla',canal:'WHATSAPP',resultado:'CONTATO_REALIZADO',observacao:'Enviadas informações da próxima turma e horários.',proximoFollowUp:'2026-10-06'},
   {id:'cont-demo-3',leadId:'lead-demo-3',criadoEm:'2026-10-02T13:00:00-03:00',responsavel:'Carla',canal:'SISTEMA',resultado:'ATENDIMENTO_ASSUMIDO',observacao:'Atendimento assumido.',proximoFollowUp:''},
   {id:'cont-demo-4',leadId:'lead-demo-3',criadoEm:'2026-10-03T10:20:00-03:00',responsavel:'Carla',canal:'LIGACAO',resultado:'AGUARDANDO_RETORNO',observacao:'Falou que irá confirmar disponibilidade de horário.',proximoFollowUp:'2026-10-07'},
   {id:'cont-demo-5',leadId:'lead-demo-4',criadoEm:'2026-10-03T15:45:00-03:00',responsavel:'Juliana',canal:'WHATSAPP',resultado:'INTERESSADO',observacao:'Interessado em efetivar matrícula na T38.',proximoFollowUp:'2026-10-05'},
   {id:'cont-demo-6',leadId:'lead-demo-5',criadoEm:'2026-10-02T17:30:00-03:00',responsavel:'Juliana',canal:'EMAIL',resultado:'SEM_INTERESSE',observacao:'Optou por outro curso neste momento.',proximoFollowUp:''}
  ]));
 }
}
seedGestaoDemo();
const LS='clinvet_agendamentos_v2';
const SESSION='clinvet_aluno_session';
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function ymd(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function easterDate(y){let a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,day)}
function addDays(d,n){let x=new Date(d);x.setDate(x.getDate()+n);return x}
function holidayName(dt){const key=ymd(dt),y=dt.getFullYear(),fixed={
 [`${y}-01-01`]:'Confraternização Universal',[`${y}-01-26`]:'Aniversário de Santos',[`${y}-04-21`]:'Tiradentes',[`${y}-05-01`]:'Dia do Trabalho',[`${y}-07-09`]:'Revolução Constitucionalista',[`${y}-09-07`]:'Independência do Brasil',[`${y}-09-08`]:'Nossa Senhora do Monte Serrat',[`${y}-10-12`]:'Nossa Senhora Aparecida',[`${y}-11-02`]:'Finados',[`${y}-11-15`]:'Proclamação da República',[`${y}-11-20`]:'Consciência Negra',[`${y}-12-25`]:'Natal'};
 if(fixed[key])return fixed[key]; const easter=easterDate(y); if(key===ymd(addDays(easter,-2)))return 'Sexta-feira Santa'; if(key===ymd(addDays(easter,60)))return 'Corpus Christi'; return ''}
function isHoliday(dt){return !!holidayName(dt)}
function monthLabel(d){return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
function getSession(){try{return JSON.parse(sessionStorage.getItem(SESSION)||'null')}catch{return null}}
function setSession(v){sessionStorage.setItem(SESSION,JSON.stringify(v))}
function logout(){sessionStorage.removeItem(SESSION);location.href='index.html'}
async function request(payload){
 if(DEMO) return demoApi(payload);
 const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
 const j=await r.json(); if(!j.ok) throw new Error(j.error||'Não foi possível concluir a operação.'); return j;
}
async function login(matricula,senha){return request({acao:'login',matricula,senha})}
async function api(acao,dados={}){const s=getSession();return (await request({acao,...dados,token:s?.token||''})).data}
async function lead(dados){return request({acao:'lead',...dados})}
function demoApi(p){
 if(p.acao==='login') return Promise.resolve({ok:true,token:'demo-token',aluno:{matricula:p.matricula,nome:'Aluno Demonstração',turma:'Auxiliar Vet • 2026.2',materialUrl:'https://drive.google.com/'}});
 if(p.acao==='lead'){let a=JSON.parse(localStorage.getItem('clinvet_leads')||'[]');let x={id:crypto.randomUUID(),...p,criadoEm:new Date().toISOString(),status:'NOVO',responsavel:'',ultimoContatoEm:'',ultimoCanal:'',matricula:'',turma:''};a.push(x);localStorage.setItem('clinvet_leads',JSON.stringify(a));return Promise.resolve({ok:true,id:x.id});}
 if(p.acao==='gestaoTurmasListar')return Promise.resolve({ok:true,data:JSON.parse(localStorage.getItem('clinvet_turmas')||'[]')});
 if(p.acao==='gestaoTurmaSalvar'){let ts=JSON.parse(localStorage.getItem('clinvet_turmas')||'[]'),now=new Date().toISOString();if(p.id){let i=ts.findIndex(x=>x.id===p.id);if(i>=0)ts[i]={...ts[i],nome:p.nome,dataInicio:p.dataInicio,dataFim:p.dataFim,status:p.status||'ATIVA',atualizadoEm:now}}else ts.push({id:crypto.randomUUID(),nome:p.nome,dataInicio:p.dataInicio,dataFim:p.dataFim,status:p.status||'ATIVA',criadoEm:now,atualizadoEm:now});localStorage.setItem('clinvet_turmas',JSON.stringify(ts));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='gestaoLeadsListar')return Promise.resolve({ok:true,data:JSON.parse(localStorage.getItem('clinvet_leads')||'[]').slice().reverse()});
 if(p.acao==='gestaoLeadDetalhe'){let ls=JSON.parse(localStorage.getItem('clinvet_leads')||'[]'),h=JSON.parse(localStorage.getItem('clinvet_contatos')||'[]');return Promise.resolve({ok:true,data:{lead:ls.find(x=>x.id===p.id),historico:h.filter(x=>x.leadId===p.id).sort((a,b)=>String(b.criadoEm).localeCompare(String(a.criadoEm)))}});}
 if(p.acao==='gestaoLeadAssumir'){let ls=JSON.parse(localStorage.getItem('clinvet_leads')||'[]'),i=ls.findIndex(x=>x.id===p.id);if(i<0)return Promise.reject(new Error('Pré-matrícula não encontrada.'));if(ls[i].responsavel&&ls[i].responsavel!==p.responsavel)return Promise.reject(new Error('Este contato já está sendo atendido por '+ls[i].responsavel+'.'));ls[i].responsavel=p.responsavel;ls[i].status='EM_CONTATO';ls[i].assumidoEm=new Date().toISOString();localStorage.setItem('clinvet_leads',JSON.stringify(ls));let h=JSON.parse(localStorage.getItem('clinvet_contatos')||'[]');h.push({id:crypto.randomUUID(),leadId:p.id,criadoEm:new Date().toISOString(),responsavel:p.responsavel,canal:'SISTEMA',resultado:'ATENDIMENTO_ASSUMIDO',observacao:'Responsável assumiu o lead'});localStorage.setItem('clinvet_contatos',JSON.stringify(h));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='gestaoContatoRegistrar'){let ls=JSON.parse(localStorage.getItem('clinvet_leads')||'[]'),i=ls.findIndex(x=>x.id===p.id);if(i<0)return Promise.reject(new Error('Pré-matrícula não encontrada.'));if(ls[i].responsavel&&ls[i].responsavel!==p.responsavel)return Promise.reject(new Error('Este lead está atribuído a '+ls[i].responsavel+'.'));let st=p.resultado==='SEM_INTERESSE'?'PERDIDO':p.resultado==='AGUARDANDO_RETORNO'?'AGUARDANDO':p.resultado==='INTERESSADO'?'INTERESSADO':'EM_CONTATO';ls[i]={...ls[i],responsavel:p.responsavel,status:st,ultimoContatoEm:new Date().toISOString(),ultimoCanal:p.canal,motivoPerda:st==='PERDIDO'?(p.observacao||'Sem interesse'):ls[i].motivoPerda};localStorage.setItem('clinvet_leads',JSON.stringify(ls));let h=JSON.parse(localStorage.getItem('clinvet_contatos')||'[]');h.push({id:crypto.randomUUID(),leadId:p.id,criadoEm:new Date().toISOString(),responsavel:p.responsavel,canal:p.canal,resultado:p.resultado,observacao:p.observacao||'',proximoFollowUp:p.proximoFollowUp||''});localStorage.setItem('clinvet_contatos',JSON.stringify(h));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='gestaoLeadStatus'){let ls=JSON.parse(localStorage.getItem('clinvet_leads')||'[]'),i=ls.findIndex(x=>x.id===p.id);if(i>=0){ls[i].status=p.status;ls[i].motivoPerda=p.motivo||''}localStorage.setItem('clinvet_leads',JSON.stringify(ls));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='gestaoMatricular'){let ls=JSON.parse(localStorage.getItem('clinvet_leads')||'[]'),i=ls.findIndex(x=>x.id===p.id);if(i<0)return Promise.reject(new Error('Pré-matrícula não encontrada.'));let year=new Date().getFullYear(),num=String(Math.floor(Math.random()*9000)+1000),mat=String(year)+num,senha=Math.random().toString(36).slice(-8).toUpperCase();ls[i]={...ls[i],status:'MATRICULADO',responsavel:p.responsavel,matricula:mat,turma:p.turma,convertidoEm:new Date().toISOString()};localStorage.setItem('clinvet_leads',JSON.stringify(ls));return Promise.resolve({ok:true,data:{matricula:mat,senhaTemporaria:senha,nome:ls[i].nome,email:ls[i].email,turma:p.turma}});}
 let a=JSON.parse(localStorage.getItem(LS)||'[]');
 if(p.acao==='listar')return Promise.resolve({ok:true,data:a});
 if(p.acao==='datasBloqueadas')return Promise.resolve({ok:true,data:[]});
 if(p.acao==='notasTurmas')return Promise.resolve({ok:true,data:['Auxiliar Vet • 2026.2','Auxiliar Vet • 2027.1']});
 if(p.acao==='notasAlunosTurma')return Promise.resolve({ok:true,data:[{matricula:'20260001',nome:'Ana Oliveira',turma:p.turma},{matricula:'20260002',nome:'Bruno Santos',turma:p.turma},{matricula:'20260003',nome:'Carolina Lima',turma:p.turma}]});
 if(p.acao==='notasAtividades'){let n=JSON.parse(localStorage.getItem('clinvet_notas')||'[]');let m={};n.filter(x=>!p.turma||x.turma===p.turma).forEach(x=>m[x.turma+'|'+x.atividade]={turma:x.turma,atividade:x.atividade,atualizadoEm:x.atualizadoEm});return Promise.resolve({ok:true,data:Object.values(m)});}
 if(p.acao==='notasCarregar'){let n=JSON.parse(localStorage.getItem('clinvet_notas')||'[]'),als=[{matricula:'20260001',nome:'Ana Oliveira',turma:p.turma},{matricula:'20260002',nome:'Bruno Santos',turma:p.turma},{matricula:'20260003',nome:'Carolina Lima',turma:p.turma}];return Promise.resolve({ok:true,data:als.map(a=>({...a,nota:(n.find(x=>x.turma===p.turma&&x.atividade===p.atividade&&x.matricula===a.matricula)||{}).nota??''}))});}
 if(p.acao==='notasLancar'){let n=JSON.parse(localStorage.getItem('clinvet_notas')||'[]');for(const item of p.notas||[]){let i=n.findIndex(x=>x.turma===p.turma&&x.atividade===p.atividade&&x.matricula===item.matricula),obj={turma:p.turma,atividade:p.atividade,matricula:item.matricula,nota:Number(item.nota),atualizadoEm:new Date().toISOString()};if(i>=0)n[i]={...n[i],...obj};else n.push(obj)}localStorage.setItem('clinvet_notas',JSON.stringify(n));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='minhasNotas'){let s=getSession()||{},n=JSON.parse(localStorage.getItem('clinvet_notas')||'[]').filter(x=>x.matricula===s.matricula);if(!n.length)n=[{turma:s.turma||'Auxiliar Vet • 2026.2',atividade:'Biossegurança e manejo',nota:8.5,atualizadoEm:new Date().toISOString()}];return Promise.resolve({ok:true,data:n});}
 if(p.acao==='feedbackAgendados'){let regs=a.filter(x=>x.data===p.data&&x.turno===p.turno&&x.status==='APROVADO');if(!regs.length){regs=[{matricula:'20260001',nome:'Ana Oliveira',especialidade:'Clínica',data:p.data,turno:p.turno,status:'APROVADO'},{matricula:'20260002',nome:'Bruno Santos',especialidade:'Clínica',data:p.data,turno:p.turno,status:'APROVADO'}]}return Promise.resolve({ok:true,data:regs.map(x=>({matricula:x.matricula,nome:x.nome,especialidade:x.especialidade,data:x.data,turno:x.turno}))});}
 if(p.acao==='material')return Promise.resolve({ok:true,data:{url:(getSession()||{}).materialUrl||'https://drive.google.com/'}});
 if(p.acao==='solicitar'){let d=p.dados||p;let count=a.filter(x=>x.data===d.data&&x.especialidade===d.especialidade&&x.turno===d.turno&&x.status!=='REMOVIDO').length;if(count>=2)return Promise.reject(new Error('Este horário acabou de atingir o limite de 2 alunos.'));let s=getSession()||{nome:'Aluno Demonstração',matricula:'DEMO'};a.push({...d,id:crypto.randomUUID(),nome:s.nome,matricula:s.matricula,status:'PENDENTE',criadoEm:new Date().toISOString()});localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='aprovar'||p.acao==='remover'){let i=a.findIndex(x=>x.id===p.id);if(i>=0)a[i].status=p.acao==='aprovar'?'APROVADO':'REMOVIDO';localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='cancelar'){let i=a.findIndex(x=>x.id===p.id);if(i>=0){let x=a[i],start=new Date(x.data+'T'+(x.turno.includes('08h')?'08:00':x.turno.includes('14h')?'14:00':x.turno.includes('18h')?'18:00':'13:00'));x.status='CANCELADO';x.canceladoEm=new Date().toISOString();x.antecedenciaHoras=Math.max(0,(start-new Date())/36e5)}localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='aprovarTodos'){a.forEach(x=>{if(x.status==='PENDENTE')x.status='APROVADO'});localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 return Promise.resolve({ok:true,data:a});
}