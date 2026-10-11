const qs=new URLSearchParams(location.search);const leadId=qs.get('lead')||'';const turmaInicial=qs.get('turma')||'';responsavel.value=qs.get('responsavel')||localStorage.getItem('clinvet_gestor_nome')||'';let fotoData='';let leadAtual=null;
async function init(){
 if(!leadId){alert('Pré-matrícula não informada.');location.href='gestao.html';return}
 const [detalhe,turmas]=await Promise.all([api('gestaoLeadDetalhe',{id:leadId}),api('gestaoTurmasListar')]);
 leadAtual=detalhe.lead;
 if(!leadAtual){alert('Pré-matrícula não encontrada.');location.href='gestao.html';return}
 nome.value=leadAtual.nome||'';email.value=leadAtual.email||'';telefone.value=leadAtual.telefone||'';statusOrigem.textContent=leadAtual.status||'';
 turma.innerHTML='<option value="">Selecione...</option>'+turmas.filter(t=>t.status!=='ENCERRADA').map(t=>'<option>'+esc(t.nome)+'</option>').join('');
 if(turmaInicial)turma.value=turmaInicial;
}
foto.onchange=()=>{const arq=foto.files&&foto.files[0];if(!arq)return;if(arq.size>2*1024*1024){alert('Escolha uma imagem de até 2 MB.');foto.value='';return}const fr=new FileReader();fr.onload=()=>{fotoData=fr.result;fotoPreview.src=fotoData;fotoPreview.style.display='block';avatarFallback.style.display='none'};fr.readAsDataURL(arq)};
salvar.onclick=async()=>{if(!nome.value.trim()||!turma.value||!responsavel.value.trim()){alert('Preencha nome, turma e responsável.');return}if(!fotoData&&!confirm('Deseja finalizar a matrícula sem foto? Ela poderá ser adicionada depois.'))return;salvar.disabled=true;try{const d=await api('gestaoMatricular',{id:leadId,responsavel:responsavel.value.trim(),turma:turma.value,nome:nome.value.trim(),email:email.value.trim(),telefone:telefone.value.trim(),dataNascimento:dataNascimento.value,foto:fotoData});retorno.innerHTML='<b>✓ Matrícula efetivada</b><br>Aluno: '+esc(d.nome)+'<br>Matrícula: <b>'+esc(d.matricula)+'</b><br>Senha temporária: <b>'+esc(d.senhaTemporaria)+'</b><br>Turma: '+esc(d.turma)+'<br><br><a class="btn success" href="gestao.html">Voltar para gestão</a>';retorno.classList.remove('hidden')}catch(e){alert(e.message);salvar.disabled=false}};
init();