const menuButton=document.querySelector('.hamb');
const nav=document.querySelector('nav');
menuButton.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const loginModalEl=document.getElementById('loginModal');
const openLoginButton=document.getElementById('openLogin');
const footerLoginButton=document.getElementById('footerLogin');
const closeLoginButton=document.getElementById('closeLogin');
const loginFormEl=document.getElementById('loginForm');
const loginMatriculaEl=document.getElementById('loginMatricula');
const loginSenhaEl=document.getElementById('loginSenha');
const loginStatusEl=document.getElementById('loginStatus');
function showLogin(){loginModalEl.classList.add('show');loginModalEl.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>loginMatriculaEl.focus(),50)}
function hideLogin(){loginModalEl.classList.remove('show');loginModalEl.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
openLoginButton.addEventListener('click',showLogin);
footerLoginButton.addEventListener('click',showLogin);
closeLoginButton.addEventListener('click',hideLogin);
loginModalEl.addEventListener('click',e=>{if(e.target===loginModalEl)hideLogin()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideLogin()});
loginFormEl.addEventListener('submit',async e=>{e.preventDefault();loginStatusEl.textContent='Validando acesso...';try{const r=await login(loginMatriculaEl.value.trim(),loginSenhaEl.value);setSession({token:r.token,nome:r.aluno.nome,matricula:r.aluno.matricula});loginStatusEl.textContent='Acesso autorizado. Abrindo agenda...';location.href='aluno.html'}catch(err){loginStatusEl.textContent=err.message}});
const leadFormEl=document.getElementById('leadForm'), leadStatusEl=document.getElementById('leadStatus');
leadFormEl.addEventListener('submit',async e=>{e.preventDefault();leadStatusEl.textContent='Enviando...';const d=Object.fromEntries(new FormData(leadFormEl).entries());try{await lead(d);leadFormEl.reset();leadStatusEl.textContent='Recebemos seu interesse! A equipe poderá entrar em contato com você.'}catch(err){leadStatusEl.textContent='Não foi possível enviar agora. '+err.message}});
