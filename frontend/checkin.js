async function registrar(tipo){
 resultado.style.display='none';
 if(!matricula.value.trim()||!senha.value){alert('Informe matrícula e senha.');return}
 checkin.disabled=checkout.disabled=true;
 try{
  let d;
  if(DEMO){
   d=tipo==='checkin'
    ?{nome:'Aluno Demonstração',especialidade:'Clínica',turno:'Manhã 08h–13h',checkInEm:new Date(),jaRealizado:false}
    :{nome:'Aluno Demonstração',especialidade:'Clínica',turno:'Manhã 08h–13h',checkInEm:new Date(Date.now()-3*3600000),checkOutEm:new Date(),horasRealizadas:3};
  }else{
   d=(await request({acao:tipo==='checkin'?'checkinEstagio':'checkoutEstagio',matricula:matricula.value.trim(),senha:senha.value})).data;
  }
  resultado.className='result ok';
  if(tipo==='checkin'){
   resultado.innerHTML='<b>✓ Check-in '+(d.jaRealizado?'já registrado':'realizado com sucesso')+'!</b><br><br><strong>'+esc(d.nome)+'</strong><br>'+esc(d.especialidade)+' • '+esc(d.turno)+'<br><small>Entrada: '+new Date(d.checkInEm).toLocaleString('pt-BR')+'</small>'+(d.checkOutEm?'<br><small>Saída: '+new Date(d.checkOutEm).toLocaleString('pt-BR')+'</small>':'');
  }else{
   resultado.innerHTML='<b>✓ Check-out realizado com sucesso!</b><br><br><strong>'+esc(d.nome)+'</strong><br>'+esc(d.especialidade)+' • '+esc(d.turno)+'<br><small>Entrada: '+new Date(d.checkInEm).toLocaleString('pt-BR')+'</small><br><small>Saída: '+new Date(d.checkOutEm).toLocaleString('pt-BR')+'</small><br><b>'+Number(d.horasRealizadas||0).toLocaleString('pt-BR',{maximumFractionDigits:2})+'h registradas</b>';
  }
  resultado.style.display='block';senha.value='';
 }catch(e){resultado.className='result err';resultado.textContent=e.message;resultado.style.display='block'}
 finally{checkin.disabled=checkout.disabled=false}
}
checkin.onclick=function(){registrar('checkin')};checkout.onclick=function(){registrar('checkout')};
