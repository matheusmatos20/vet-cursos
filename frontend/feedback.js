const defs=[['reconhecimento','Atitude e colaboração','Disposição para ajudar, trabalhar em equipe e contribuir com a rotina.'],['proatividade','Proatividade','Iniciativa, interesse e capacidade de antecipar necessidades.'],['conhecimento','Conhecimento','Aplicação do conteúdo, aprendizado e evolução técnica.'],['postura','Postura profissional','Responsabilidade, pontualidade, comunicação e respeito.']];const notas={};
criteria.innerHTML=defs.map(d=>`<div class="criterion"><label>${d[1]}</label><small>${d[2]}</small><div class="stars" data-k="${d[0]}">${[1,2,3,4,5].map(n=>`<button type="button" data-n="${n}">★</button>`).join('')}</div></div>`).join('');
document.querySelectorAll('.stars').forEach(g=>g.onclick=e=>{if(!e.target.dataset.n)return;let n=+e.target.dataset.n,k=g.dataset.k;notas[k]=n;g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.n<=n))});
dataEstagio.value=new Date().toISOString().slice(0,10);
let estagiariosPeriodo=[];
async function carregarEstagiarios(){
  aluno.innerHTML='<option value="">Carregando...</option>'; aluno.disabled=true;
  if(!dataEstagio.value||!turno.value){aluno.innerHTML='<option value="">Escolha data e horário...</option>';alunoHint.textContent='Os estagiários aparecerão após selecionar o período.';return}
  try{
    estagiariosPeriodo=await api('feedbackAgendados',{data:dataEstagio.value,turno:turno.value});
  }catch(e){estagiariosPeriodo=[]}
  aluno.innerHTML='<option value="">Selecione...</option>';
  estagiariosPeriodo.forEach(x=>aluno.add(new Option(x.nome+' • '+x.especialidade,x.matricula)));
  aluno.disabled=!estagiariosPeriodo.length;
  alunoHint.textContent=estagiariosPeriodo.length?estagiariosPeriodo.length+' estagiário(s) agendado(s) neste período.':'Nenhum estagiário aprovado/agendado neste período.';
}
dataEstagio.addEventListener('change',carregarEstagiarios);turno.addEventListener('change',carregarEstagiarios);
enviar.onclick=async()=>{if(!dataEstagio.value||!turno.value||!aluno.value||!avaliador.value.trim()){alert('Selecione data, horário, estagiário e informe seu nome.');return}if(defs.some(d=>!notas[d[0]])){alert('Avalie todos os quatro critérios.');return}let est=estagiariosPeriodo.find(x=>x.matricula===aluno.value)||{};let p={matricula:aluno.value,data:dataEstagio.value,turno:turno.value,especialidade:est.especialidade||'',avaliador:avaliador.value.trim(),funcao:funcao.value.trim(),comentario:comentario.value.trim(),tipo:document.querySelector('input[name=tipo]:checked').value,...notas};try{await api('feedbackEnviar',p);ok.style.display='block';enviar.disabled=true}catch(e){let arr=JSON.parse(localStorage.getItem('clinvet_feedbacks')||'[]'),nome=est.nome||aluno.options[aluno.selectedIndex].text.split(' • ')[0],media=(notas.reconhecimento+notas.proatividade+notas.conhecimento+notas.postura)/4;arr.push({...p,nome,media,criadoEm:new Date().toISOString()});localStorage.setItem('clinvet_feedbacks',JSON.stringify(arr));ok.style.display='block';enviar.disabled=true}}
