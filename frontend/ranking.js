let rel=[];
const demoRoster=[
 {matricula:'20260001',nome:'Ana Beatriz Souza',turma:'Auxiliar Vet • 2026.2'},
 {matricula:'20260002',nome:'Bruno Martins',turma:'Auxiliar Vet • 2026.2'},
 {matricula:'20260003',nome:'Carolina Lima',turma:'Auxiliar Vet • 2026.2'},
 {matricula:'20260004',nome:'Diego Santos',turma:'Auxiliar Vet • 2026.2'},
 {matricula:'20260005',nome:'Fernanda Alves',turma:'Auxiliar Vet • 2026.2'},
 {matricula:'20261001',nome:'Gabriel Rocha',turma:'Auxiliar Vet • 2026.1'},
 {matricula:'20261002',nome:'Helena Costa',turma:'Auxiliar Vet • 2026.1'}];
function buildDemo(){let a=JSON.parse(localStorage.getItem(LS)||'[]');if(!a.length){const esp=['Clínica','Internação','Imagem','Cirurgia','Reabilita'];const qty=[9,7,5,3,0,6,1];demoRoster.forEach((u,i)=>{for(let n=0;n<qty[i];n++)a.push({id:'r'+i+'-'+n,nome:u.nome,matricula:u.matricula,especialidade:esp[n%esp.length],data:'2026-10-'+String(2+n).padStart(2,'0'),turno:'Manhã 08h–13h',status:n%4===0?'PENDENTE':'APROVADO'})})}
 return demoRoster.map(u=>{let x=a.filter(v=>String(v.matricula)===u.matricula&&v.status!=='REMOVIDO'),c={};Object.keys(ESPECIALIDADES).forEach(e=>c[e]=x.filter(v=>v.especialidade===e).length);return {...u,contagens:c,total:x.length,pendentes:x.filter(v=>v.status==='PENDENTE').length}})}
async function loadReport(){try{if(DEMO)rel=buildDemo();else rel=(await request({acao:'relatorio'})).data||[];setup()}catch(e){alert(e.message)}}
function setup(){[...new Set(rel.map(x=>x.turma).filter(Boolean))].sort().forEach(t=>turma.add(new Option(t,t)));turma.onchange=render;render()}
function render(){let a=rel.filter(x=>turma.value==='TODAS'||x.turma===turma.value).sort((x,y)=>y.total-x.total||x.nome.localeCompare(y.nome,'pt-BR'));sAlunos.textContent=a.length;sMarcaram.textContent=a.filter(x=>x.total>0).length;sNao.textContent=a.filter(x=>x.total===0).length;sPeriodos.textContent=a.reduce((s,x)=>s+x.total,0);const medals=['🥇','🥈','🥉'];podium.innerHTML=a.slice(0,3).map((x,i)=>`<div class="medal"><div class="pos">${medals[i]}</div><h3>${esc(x.nome)}</h3><small>${esc(x.matricula)} • ${esc(x.turma||'Sem turma')}</small><br><strong>${x.total}</strong> <span>períodos</span></div>`).join('');rankBody.innerHTML=a.map((x,i)=>`<tr class="${x.total===0?'zero':''}"><td><b>${i+1}º</b></td><td><b>${esc(x.nome)}</b><br><small>${esc(x.matricula)} • ${esc(x.turma||'Sem turma')}</small></td><td>${x.contagens['Internação']||0}</td><td>${x.contagens['Clínica']||0}</td><td>${x.contagens['Imagem']||0}</td><td>${x.contagens['Reabilita']||0}</td><td>${x.contagens['Cirurgia']||0}</td><td><b>${x.total}</b></td><td>${x.pendentes?`<span class="pill">${x.pendentes}</span>`:'0'}</td></tr>`).join('')||'<tr><td colspan="9">Nenhum aluno encontrado nesta turma.</td></tr>'}
loadReport();
