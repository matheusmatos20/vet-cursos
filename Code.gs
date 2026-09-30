const SHEET_AG='Agendamentos', SHEET_AL='Alunos', SHEET_LEADS='Leads', SHEET_BLOCK='DatasBloqueadas';
const SESSION_TTL=21600; // 6 horas

function doPost(e){
 try{
  const p=JSON.parse(e.postData.contents||'{}'), acao=p.acao||p.action;
  if(acao==='login') return out(loginAluno(p.matricula,p.senha));
  if(acao==='lead') return out(registrarLead(p));
  if(acao==='relatorio') return out({ok:true,data:relatorioEstagios()});
  if(acao==='painelHoje') return out({ok:true,data:painelHoje(p.data)});
  if(acao==='feedbackAlunos') return out({ok:true,data:alunosParaFeedback()});
  if(acao==='feedbackAgendados') return out({ok:true,data:estagiariosAgendadosParaFeedback(p.data,p.turno)});
  if(acao==='feedbackEnviar') return out({ok:true,data:registrarFeedback(p)});
  if(acao==='feedbackListar') return out({ok:true,data:listarFeedbacks()});
  if(acao==='notasTurmas') return out({ok:true,data:listarTurmasNotas()});
  if(acao==='notasAlunosTurma') return out({ok:true,data:alunosDaTurma(p.turma)});
  if(acao==='notasAtividades') return out({ok:true,data:listarAtividadesNotas(p.turma)});
  if(acao==='notasCarregar') return out({ok:true,data:carregarNotasAtividade(p.turma,p.atividade)});
  if(acao==='notasLancar') return out({ok:true,data:lancarNotasAtividade(p)});
  let aluno=validarSessao(p.token);
  if(!aluno) throw new Error('Sessão expirada ou acesso inválido. Entre novamente pela Área do Aluno.');
  let data;
  if(acao==='listar') data=listar();
  else if(acao==='datasBloqueadas') data=listarBloqueios();
  else if(acao==='material') data={url:aluno.materialUrl||''};
  else if(acao==='minhasNotas') data=minhasNotas(aluno);
  else if(acao==='cancelar') data=cancelar(p.id,aluno);
  else if(acao==='solicitar') data=solicitar(p.dados||p,aluno);
  else if(acao==='aprovar') data=alterarStatus(p.id,'APROVADO');
  else if(acao==='aprovarTodos') data=aprovarTodos();
  else if(acao==='remover') data=remover(p.id);
  else throw new Error('Ação inválida');
  return out({ok:true,data});
 }catch(err){return out({ok:false,error:err.message})}
}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function ss(){return SpreadsheetApp.getActive()}
function getSheet(nome,cab){let s=ss().getSheetByName(nome);if(!s){s=ss().insertSheet(nome);s.appendRow(cab)}return s}
function shAg(){return getSheet(SHEET_AG,['ID','Nome','Matricula','Especialidade','Data','Turno','Status','CriadoEm','AtualizadoEm','CanceladoEm','AntecedenciaHoras'])}
function shAl(){return getSheet(SHEET_AL,['Matricula','Nome','SenhaHash','Ativo','Turma','MaterialURL'])}
function shBlock(){return getSheet(SHEET_BLOCK,['Data','Motivo','Ativo'])}
function shLeads(){return getSheet(SHEET_LEADS,['CriadoEm','Nome','Telefone','Email','Curso','Mensagem'])}
function hashSenha(s){let b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8);return b.map(x=>('0'+((x<0?x+256:x).toString(16))).slice(-2)).join('')}

function loginAluno(matricula,senha){
 matricula=String(matricula||'').trim(); if(!matricula||!senha) throw new Error('Informe matrícula e senha.');
 const v=shAl().getDataRange().getValues();
 for(let i=1;i<v.length;i++){
  if(String(v[i][0]).trim()===matricula){
   if(String(v[i][3]).toUpperCase()==='NÃO'||v[i][3]===false) throw new Error('Acesso inativo. Procure a secretaria.');
   if(String(v[i][2])!==hashSenha(senha)) throw new Error('Matrícula ou senha inválida.');
   const aluno={matricula,nome:String(v[i][1]),turma:String(v[i][4]||''),materialUrl:String(v[i][5]||'')}, token=Utilities.getUuid()+Utilities.getUuid();
   CacheService.getScriptCache().put('sess_'+token,JSON.stringify(aluno),SESSION_TTL);
   return {ok:true,token,aluno};
  }
 }
 throw new Error('Matrícula ou senha inválida.');
}
function validarSessao(token){if(!token)return null;const x=CacheService.getScriptCache().get('sess_'+token);return x?JSON.parse(x):null}

function listar(){
 const s=shAg(),v=s.getDataRange().getValues();if(v.length<2)return [];
 return v.slice(1).filter(r=>r[0]).map(r=>({id:String(r[0]),nome:r[1],matricula:String(r[2]),especialidade:r[3],data:Utilities.formatDate(new Date(r[4]),Session.getScriptTimeZone(),'yyyy-MM-dd'),turno:r[5],status:r[6],criadoEm:r[7],atualizadoEm:r[8],canceladoEm:r[9]||'',antecedenciaHoras:r[10]||''}));
}
function solicitar(p,aluno){
 if(!p.especialidade||!p.data||!p.turno)throw new Error('Dados incompletos.');
 const motivo=dataBloqueada(p.data); if(motivo) throw new Error('Não é permitido agendar nesta data: '+motivo+'.');
 const lock=LockService.getScriptLock();lock.waitLock(10000);
 try{
  const ocupadas=listar().filter(x=>x.data===p.data&&x.especialidade===p.especialidade&&x.turno===p.turno&&!['REMOVIDO','CANCELADO'].includes(x.status));
  if(ocupadas.length>=2)throw new Error('Período lotado. Já existem 2 vagas ocupadas/reservadas.');
  if(ocupadas.some(x=>x.matricula===aluno.matricula))throw new Error('Você já possui uma solicitação neste período.');
  const id=Utilities.getUuid(),now=new Date();
  shAg().appendRow([id,aluno.nome,aluno.matricula,p.especialidade,new Date(p.data+'T12:00:00'),p.turno,'PENDENTE',now,now,'','']);
  notificarCoordenacao(aluno,p);
  return {id,status:'PENDENTE'};
 }finally{lock.releaseLock()}
}
function notificarCoordenacao(aluno,p){
 const dest=PropertiesService.getScriptProperties().getProperty('COORDENACAO_EMAIL'); if(!dest)return;
 MailApp.sendEmail({to:dest,subject:'Nova solicitação de estágio — '+aluno.nome,htmlBody:'<b>Aluno:</b> '+html(aluno.nome)+' ('+html(aluno.matricula)+')<br><b>Especialidade:</b> '+html(p.especialidade)+'<br><b>Data:</b> '+html(p.data)+'<br><b>Turno:</b> '+html(p.turno)+'<br><br>Acesse a área da coordenação para aprovar ou remover.'});
}
function registrarLead(p){
 if(!p.nome||!p.telefone||!p.email||!p.curso)throw new Error('Preencha os campos obrigatórios.');
 shLeads().appendRow([new Date(),p.nome,p.telefone,p.email,p.curso,p.mensagem||'']);
 const dest=PropertiesService.getScriptProperties().getProperty('LEADS_EMAIL')||'contato@clin.vet.br';
 MailApp.sendEmail({to:dest,replyTo:p.email,subject:'Novo interesse em curso — '+p.nome,htmlBody:'<b>Nome:</b> '+html(p.nome)+'<br><b>WhatsApp:</b> '+html(p.telefone)+'<br><b>E-mail:</b> '+html(p.email)+'<br><b>Interesse:</b> '+html(p.curso)+'<br><b>Mensagem:</b> '+html(p.mensagem||'—')});
 return {ok:true};
}
function html(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function rowById(id){const s=shAg(),last=s.getLastRow();if(last<2)throw new Error('Agendamento não encontrado');const v=s.getRange(2,1,last-1,1).getValues();for(let i=0;i<v.length;i++)if(String(v[i][0])===String(id))return i+2;throw new Error('Agendamento não encontrado')}
function alterarStatus(id,status){const s=shAg(),r=rowById(id);s.getRange(r,7).setValue(status);s.getRange(r,9).setValue(new Date());return true}
function aprovarTodos(){const s=shAg(),last=s.getLastRow();if(last<2)return true;const rg=s.getRange(2,1,last-1,11),v=rg.getValues(),now=new Date();v.forEach(r=>{if(r[6]==='PENDENTE'){r[6]='APROVADO';r[8]=now}});rg.setValues(v);return true}
function remover(id){return alterarStatus(id,'REMOVIDO')}

function cadastrarAluno(matricula,nome,senha,turma,materialUrl){const s=shAl(),v=s.getDataRange().getValues();for(let i=1;i<v.length;i++)if(String(v[i][0])===String(matricula)){s.getRange(i+1,2,1,5).setValues([[nome,hashSenha(senha),'SIM',turma||'',materialUrl||'']]);return} s.appendRow([matricula,nome,hashSenha(senha),'SIM',turma||'',materialUrl||''])}

function listarBloqueios(){const s=shBlock(),v=s.getDataRange().getValues();if(v.length<2)return [];return v.slice(1).filter(r=>r[0]&&String(r[2]||'SIM').toUpperCase()!=='NÃO').map(r=>({data:Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone(),'yyyy-MM-dd'),motivo:String(r[1]||'Data bloqueada')}))}
function pascoa(y){let a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,day)}
function dateKey(d){return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd')}
function plusDays(d,n){let x=new Date(d);x.setDate(x.getDate()+n);return x}
function feriadoOficial(data){let d=new Date(data+'T12:00:00'),y=d.getFullYear(),k=dateKey(d),f={};[['01-01','Confraternização Universal'],['01-26','Aniversário de Santos'],['04-21','Tiradentes'],['05-01','Dia do Trabalho'],['07-09','Revolução Constitucionalista'],['09-07','Independência do Brasil'],['09-08','Nossa Senhora do Monte Serrat'],['10-12','Nossa Senhora Aparecida'],['11-02','Finados'],['11-15','Proclamação da República'],['11-20','Consciência Negra'],['12-25','Natal']].forEach(x=>f[y+'-'+x[0]]=x[1]);if(f[k])return f[k];let p=pascoa(y);if(k===dateKey(plusDays(p,-2)))return 'Sexta-feira Santa';if(k===dateKey(plusDays(p,60)))return 'Corpus Christi';return ''}
function dataBloqueada(data){let h=feriadoOficial(data);if(h)return h;let b=listarBloqueios().find(x=>x.data===data);return b?b.motivo:''}
function horaInicio(turno){let m=String(turno).match(/(\d{2})h/);return m?m[1]+':00':'08:00'}
function cancelar(id,aluno){const s=shAg(),r=rowById(id),v=s.getRange(r,1,1,11).getValues()[0];if(String(v[2])!==String(aluno.matricula))throw new Error('Você só pode desmarcar seus próprios estágios.');if(['CANCELADO','REMOVIDO'].includes(String(v[6])))throw new Error('Este estágio já foi cancelado/removido.');let data=dateKey(new Date(v[4])),inicio=new Date(data+'T'+horaInicio(v[5])+':00'),now=new Date(),horas=Math.max(0,(inicio-now)/3600000);s.getRange(r,7).setValue('CANCELADO');s.getRange(r,9,1,3).setValues([[now,now,horas]]);return {antecedenciaHoras:horas}}

function relatorioEstagios(){
 const alunos=shAl().getDataRange().getValues(), ag=listar();
 return alunos.slice(1).filter(r=>r[0] && String(r[3]).toUpperCase()!=='NÃO').map(r=>{
  const matricula=String(r[0]), regs=ag.filter(x=>x.matricula===matricula && !['REMOVIDO','CANCELADO'].includes(x.status));
  const contagens={}; ['Internação','Clínica','Imagem','Reabilita','Cirurgia'].forEach(e=>contagens[e]=regs.filter(x=>x.especialidade===e).length);
  return {matricula,nome:String(r[1]),turma:String(r[4]||'Sem turma'),contagens,total:regs.length,pendentes:regs.filter(x=>x.status==='PENDENTE').length};
 }).sort((a,b)=>b.total-a.total||a.nome.localeCompare(b.nome));
}

function painelHoje(data){
 const hoje=data||Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');
 return listar().filter(x=>x.data===hoje && !['CANCELADO','REMOVIDO'].includes(String(x.status)));
}

const SHEET_FEEDBACK='Feedbacks';
function shFeedback(){return getSheet(SHEET_FEEDBACK,['ID','CriadoEm','Aluno','Matricula','Avaliador','Funcao','Reconhecimento','Proatividade','Conhecimento','Postura','Media','Tipo','Comentario'])}

function alunosParaFeedback(){
 return shAl().getDataRange().getValues().slice(1).filter(r=>r[0]&&String(r[3]).toUpperCase()!=='NÃO').map(r=>({matricula:String(r[0]),nome:String(r[1]),turma:String(r[4]||'')}));
}
function estagiariosAgendadosParaFeedback(data,turno){
 if(!data||!turno) return [];
 const regs=listar().filter(x=>x.data===String(data)&&x.turno===String(turno)&&x.status==='APROVADO');
 const vistos={};
 return regs.filter(x=>{const k=x.matricula+'|'+x.especialidade;if(vistos[k])return false;vistos[k]=true;return true}).map(x=>({matricula:x.matricula,nome:x.nome,especialidade:x.especialidade,turno:x.turno,data:x.data}));
}
function registrarFeedback(p){
 if(!p.matricula||!p.avaliador||!p.data||!p.turno) throw new Error('Selecione data, horário, estagiário e informe seu nome.');
 const agendados=estagiariosAgendadosParaFeedback(p.data,p.turno);
 const aluno=agendados.find(a=>a.matricula===String(p.matricula)&&(!p.especialidade||a.especialidade===p.especialidade)); if(!aluno) throw new Error('Este estagiário não está aprovado/agendado no período selecionado.');
 const campos=['reconhecimento','proatividade','conhecimento','postura'], notas=campos.map(k=>Number(p[k]));
 if(notas.some(n=>n<1||n>5||!Number.isFinite(n))) throw new Error('Avalie todos os critérios de 1 a 5 estrelas.');
 const media=notas.reduce((a,b)=>a+b,0)/notas.length, tipo=String(p.tipo||'POSITIVO').toUpperCase();
 const s=shFeedback();
 if(s.getLastColumn()<16)s.getRange(1,14,1,3).setValues([['DataEstagio','Turno','Especialidade']]);
 s.appendRow([Utilities.getUuid(),new Date(),aluno.nome,aluno.matricula,p.avaliador,p.funcao||'',notas[0],notas[1],notas[2],notas[3],media,tipo,p.comentario||'',p.data,p.turno,aluno.especialidade||p.especialidade||'']);
 return {ok:true};
}
function listarFeedbacks(){
 const v=shFeedback().getDataRange().getValues(); if(v.length<2)return [];
 return v.slice(1).filter(r=>r[0]).map(r=>({id:String(r[0]),criadoEm:r[1],nome:r[2],matricula:String(r[3]),avaliador:r[4],funcao:r[5],reconhecimento:Number(r[6]),proatividade:Number(r[7]),conhecimento:Number(r[8]),postura:Number(r[9]),media:Number(r[10]),tipo:r[11],comentario:r[12],dataEstagio:r[13]||'',turno:r[14]||'',especialidade:r[15]||''}));
}

const SHEET_NOTAS='NotasAtividades';
function shNotas(){return getSheet(SHEET_NOTAS,['ID','Turma','Atividade','Matricula','Aluno','Nota','CriadoEm','AtualizadoEm'])}

function listarTurmasNotas(){
 const vals=shAl().getDataRange().getValues().slice(1);
 return [...new Set(vals.filter(r=>r[0]&&String(r[3]).toUpperCase()!=='NÃO'&&r[4]).map(r=>String(r[4]).trim()))].filter(Boolean).sort();
}
function alunosDaTurma(turma){
 turma=String(turma||'').trim();
 if(!turma)return [];
 return shAl().getDataRange().getValues().slice(1)
  .filter(r=>r[0]&&String(r[3]).toUpperCase()!=='NÃO'&&String(r[4]||'').trim()===turma)
  .map(r=>({matricula:String(r[0]),nome:String(r[1]),turma:String(r[4]||'')}))
  .sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
}
function listarAtividadesNotas(turma){
 const v=shNotas().getDataRange().getValues().slice(1);
 const f=v.filter(r=>r[0]&&(!turma||String(r[1])===String(turma)));
 const map={};
 f.forEach(r=>{const k=String(r[1])+'|'+String(r[2]);if(!map[k])map[k]={turma:String(r[1]),atividade:String(r[2]),atualizadoEm:r[7]||r[6]||''}});
 return Object.values(map).sort((a,b)=>String(b.atualizadoEm).localeCompare(String(a.atualizadoEm))||a.atividade.localeCompare(b.atividade,'pt-BR'));
}
function carregarNotasAtividade(turma,atividade){
 turma=String(turma||'').trim(); atividade=String(atividade||'').trim();
 const alunos=alunosDaTurma(turma),v=shNotas().getDataRange().getValues().slice(1),map={};
 v.filter(r=>String(r[1])===turma&&String(r[2])===atividade).forEach(r=>map[String(r[3])]=Number(r[5]));
 return alunos.map(a=>({...a,nota:Object.prototype.hasOwnProperty.call(map,a.matricula)?map[a.matricula]:''}));
}
function lancarNotasAtividade(p){
 const turma=String(p.turma||'').trim(),atividade=String(p.atividade||'').trim(),notas=Array.isArray(p.notas)?p.notas:[];
 if(!turma||!atividade)throw new Error('Informe a turma e o nome da atividade.');
 if(!notas.length)throw new Error('Informe ao menos uma nota.');
 const alunos=alunosDaTurma(turma),validos=new Set(alunos.map(a=>a.matricula)),s=shNotas(),all=s.getDataRange().getValues(),now=new Date();
 notas.forEach(item=>{
   const mat=String(item.matricula||''),nota=Number(item.nota);
   if(!validos.has(mat))throw new Error('Aluno inválido para a turma selecionada.');
   if(!Number.isFinite(nota)||nota<0||nota>10)throw new Error('As notas devem estar entre 0 e 10.');
   let row=0;
   for(let i=1;i<all.length;i++)if(String(all[i][1])===turma&&String(all[i][2])===atividade&&String(all[i][3])===mat){row=i+1;break}
   const aluno=alunos.find(a=>a.matricula===mat);
   if(row)s.getRange(row,5,1,4).setValues([[aluno.nome,nota,all[row-1][6]||now,now]]);
   else{s.appendRow([Utilities.getUuid(),turma,atividade,mat,aluno.nome,nota,now,now]);all.push([null,turma,atividade,mat,aluno.nome,nota,now,now])}
 });
 return {ok:true};
}
function minhasNotas(aluno){
 const v=shNotas().getDataRange().getValues().slice(1);
 return v.filter(r=>r[0]&&String(r[3])===String(aluno.matricula))
  .map(r=>({turma:String(r[1]||''),atividade:String(r[2]||''),nota:Number(r[5]),criadoEm:r[6]||'',atualizadoEm:r[7]||r[6]||''}))
  .sort((a,b)=>String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)));
}
