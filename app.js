const API_URL='COLE_AQUI_A_URL_DO_APPS_SCRIPT_EXEC';
const ESPECIALIDADES={
 'Internação':{dias:[0,1,2,3,4,5,6],turnos:['Manhã 08h–13h','Tarde 13h–18h','Noite 18h–23h']},
 'Clínica':{dias:[0,1,2,3,4,5,6],turnos:['Manhã 08h–13h','Tarde 13h–18h','Noite 18h–23h']},
 'Imagem':{dias:[1,2,3,4,5,6],turnos:['Manhã 08h–13h','Tarde 14h–19h']},
 'Reabilita':{dias:[1,2,3,4,5],turnos:['Tarde 14h–19h']},
 'Cirurgia':{dias:[1,2,3,4,5],turnos:['Manhã 08h–13h','Tarde 13h–18h']}
};
const DEMO=API_URL.startsWith('COLE_');
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
 if(p.acao==='lead'){let a=JSON.parse(localStorage.getItem('clinvet_leads')||'[]');a.push({...p,criadoEm:new Date().toISOString()});localStorage.setItem('clinvet_leads',JSON.stringify(a));return Promise.resolve({ok:true});}
 let a=JSON.parse(localStorage.getItem(LS)||'[]');
 if(p.acao==='listar')return Promise.resolve({ok:true,data:a});
 if(p.acao==='datasBloqueadas')return Promise.resolve({ok:true,data:[]});
 if(p.acao==='material')return Promise.resolve({ok:true,data:{url:(getSession()||{}).materialUrl||'https://drive.google.com/'}});
 if(p.acao==='solicitar'){let d=p.dados||p;let count=a.filter(x=>x.data===d.data&&x.especialidade===d.especialidade&&x.turno===d.turno&&x.status!=='REMOVIDO').length;if(count>=2)return Promise.reject(new Error('Este horário acabou de atingir o limite de 2 alunos.'));let s=getSession()||{nome:'Aluno Demonstração',matricula:'DEMO'};a.push({...d,id:crypto.randomUUID(),nome:s.nome,matricula:s.matricula,status:'PENDENTE',criadoEm:new Date().toISOString()});localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='aprovar'||p.acao==='remover'){let i=a.findIndex(x=>x.id===p.id);if(i>=0)a[i].status=p.acao==='aprovar'?'APROVADO':'REMOVIDO';localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='cancelar'){let i=a.findIndex(x=>x.id===p.id);if(i>=0){let x=a[i],start=new Date(x.data+'T'+(x.turno.includes('08h')?'08:00':x.turno.includes('14h')?'14:00':x.turno.includes('18h')?'18:00':'13:00'));x.status='CANCELADO';x.canceladoEm=new Date().toISOString();x.antecedenciaHoras=Math.max(0,(start-new Date())/36e5)}localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 if(p.acao==='aprovarTodos'){a.forEach(x=>{if(x.status==='PENDENTE')x.status='APROVADO'});localStorage.setItem(LS,JSON.stringify(a));return Promise.resolve({ok:true,data:true});}
 return Promise.resolve({ok:true,data:a});
}