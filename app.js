const navButtons=[...document.querySelectorAll('[data-page]')];
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+name));document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===name));window.scrollTo({top:0,behavior:'smooth'});}
navButtons.forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
const get=(k,d=[])=>{try{return JSON.parse(localStorage.getItem('it_'+k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem('it_'+k,JSON.stringify(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notes=document.getElementById('notes');notes.value=localStorage.getItem('ironTransferNotes')||'';notes.addEventListener('input',()=>localStorage.setItem('ironTransferNotes',notes.value));
const eventNameKey='ironTransferEventName',eventNameElements=[document.getElementById('season'),document.getElementById('seasonInfoName')],eventNameInput=document.getElementById('eventNameInput');
function applyEventName(v){eventNameElements.forEach(e=>{if(e)e.textContent=v});if(eventNameInput)eventNameInput.value=v;}
applyEventName(localStorage.getItem(eventNameKey)||'Temporada 1');
function refreshCountdown(){let val=localStorage.getItem('it_deadline');let out=document.getElementById('countdown'),date=document.getElementById('closeDate');if(!val){out.textContent='Configurar fecha de cierre';date.textContent='A definir';return;}let d=new Date(val);date.textContent=d.toLocaleString('es-AR');let ms=d-Date.now();if(ms<=0){out.textContent='EVENTO FINALIZADO';return;}let days=Math.floor(ms/86400000),hours=Math.floor(ms%86400000/3600000),mins=Math.floor(ms%3600000/60000);out.textContent=`${days} DÍAS · ${hours} H · ${mins} MIN`;}
refreshCountdown();setInterval(refreshCountdown,60000);
const adminSettings=document.getElementById('adminSettings');
document.getElementById('adminLogin').addEventListener('click',()=>{let ok=document.getElementById('adminPass').value==='iron-demo';document.getElementById('adminMsg').textContent=ok?'Acceso de demostración habilitado.':'Clave incorrecta. Para probar: iron-demo';adminSettings.hidden=!ok;if(ok){eventNameInput.value=localStorage.getItem(eventNameKey)||'Temporada 1';document.getElementById('deadlineInput').value=localStorage.getItem('it_deadline')||'';renderAll();}});
document.querySelectorAll('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.admin-view').forEach(x=>x.classList.toggle('active',x.id==='admin-'+b.dataset.adminTab));}));
document.getElementById('saveEventName').addEventListener('click',()=>{let v=eventNameInput.value.trim();if(!v){document.getElementById('eventSaveMsg').textContent='Escribí un nombre.';return;}localStorage.setItem(eventNameKey,v);applyEventName(v);localStorage.setItem('it_deadline',document.getElementById('deadlineInput').value);refreshCountdown();document.getElementById('eventSaveMsg').textContent='Evento y fecha guardados.';});
function clubs(){return get('clubs',[])}function players(){return get('players',[])}function requests(){return get('requests',[])}function budgets(){return get('budgets',{})}
function renderAll(){
 let cs=clubs(), ps=players();
 document.getElementById('adminClubList').innerHTML=cs.map((c,i)=>`<div class="admin-row">${c.logo?`<img src="${c.logo}" alt="">`:''}<b>${esc(c.name)}</b><span>$${Number(budgets()[c.name]||0).toLocaleString('es-AR')}</span><button data-delclub="${i}" class="danger-btn">ELIMINAR EQUIPO</button></div>`).join('')||'<p class="muted">Todavía no hay equipos cargados.</p>';
 let opts=cs.map(c=>`<option>${esc(c.name)}</option>`).join('');
 ['playerClubInput','moneyClub'].forEach(id=>document.getElementById(id).innerHTML=opts||'<option>Primero agregá un club</option>');
 document.getElementById('clubList').innerHTML=cs.map((c,i)=>{let count=ps.filter(p=>p.club===c.name).length;return `<button type="button" class="club-card club-card-click" data-openclub="${i}">${c.logo?`<img src="${c.logo}" alt="">`:'<span class="club-placeholder">♜</span>'}<span class="club-card-copy"><b>${esc(c.name)}</b><small>${count} jugador${count===1?'':'es'} · VER PLANTEL ↗</small></span></button>`}).join('')||'<div class="empty-state"><b>Los clubes aparecerán aquí</b></div>';
 document.getElementById('adminPlayerList').innerHTML=ps.map((x,i)=>`<div class="admin-row"><b>${esc(x.name)}</b><span>${esc(x.position)} · ${esc(x.club)}</span><select data-move="${i}">${cs.map(c=>`<option ${c.name===x.club?'selected':''}>${esc(c.name)}</option>`).join('')}</select><button data-delplayer="${i}" class="danger-btn">Quitar</button></div>`).join('')||'<p class="muted">No hay jugadores cargados.</p>';
 document.getElementById('requestsList').innerHTML=requests().map((r,i)=>`<div class="admin-row request-row"><div><b>${esc(r.type)}</b><small>${esc(r.detail)}</small><em class="status ${r.status}">${r.status.toUpperCase()}</em></div>${r.status==='pendiente'?`<button data-approve="${i}" class="approve-btn">Aprobar</button><button data-reject="${i}" class="danger-btn">Rechazar</button>`:''}</div>`).join('')||'<p class="muted">No hay solicitudes pendientes.</p>';
 document.getElementById('budgetList').innerHTML=cs.map(c=>`<div class="admin-row"><b>${esc(c.name)}</b><strong>$${Number(budgets()[c.name]||0).toLocaleString('es-AR')}</strong></div>`).join('');
 renderPublicPlayers(); renderNews(); if(typeof renderMarket==='function')renderMarket();
}
function renderPublicPlayers(){
 const q=(document.getElementById('playerSearch').value||'').trim().toLowerCase();
 const list=players().filter(p=>!q||[p.name,p.club,p.position].some(v=>String(v||'').toLowerCase().includes(q)));
 document.querySelector('#page-jugadores .empty-state')?.remove();
 const host=document.getElementById('publicPlayerList');
 if(host)host.innerHTML=list.map(p=>`<button class="public-player-row" data-openplayer="${players().indexOf(p)}"><span class="player-avatar">♟</span><span class="public-player-main"><b>${esc(p.name)}</b><small>${esc(p.position||'Sin posición')} · ${esc(p.club)}</small></span><span class="player-view">VER STATS ↗</span></button>`).join('')||'<div class="empty-state"><b>No hay jugadores cargados</b><small>Probá con otro nombre o cargá jugadores desde Administración.</small></div>';
}
function statLabel(k){return ({attack:'Ataque',defence:'Defensa',balance:'Equilibrio',stamina:'Resistencia',topSpeed:'Velocidad máxima',acceleration:'Aceleración',response:'Respuesta',agility:'Agilidad',dribbleAccuracy:'Precisión de regate',dribbleSpeed:'Velocidad de regate',shortPassAccuracy:'Precisión pase corto',shortPassSpeed:'Velocidad pase corto',longPassAccuracy:'Precisión pase largo',longPassSpeed:'Velocidad pase largo',shotAccuracy:'Precisión de tiro',shotPower:'Potencia de tiro',shotTechnique:'Técnica de tiro',freeKick:'Precisión de falta',curl:'Efecto',header:'Cabeceo',jump:'Salto',technique:'Técnica',aggression:'Agresividad',mentality:'Mentalidad',goalkeeping:'Habilidad portero',teamwork:'Trabajo en equipo'})[k]||k;}
function openDetail(title,subtitle,body){document.getElementById('detailContent').innerHTML=`<span class="eyebrow red">COLOSO LEAGUE · PES 6</span><h2 id="detailTitle">${esc(title)}</h2><p class="muted">${esc(subtitle)}</p>${body}`;const m=document.getElementById('detailModal');m.classList.add('open');m.setAttribute('aria-hidden','false');}
function openClub(index){const c=clubs()[index];if(!c)return;const squad=players().filter(p=>p.club===c.name);const body=squad.length?`<div class="roster-list">${squad.map((p)=>`<button class="roster-player" data-openplayer="${players().indexOf(p)}"><b>${esc(p.name)}</b><span>${esc(p.position||'Sin posición')}</span><small>VER ESTADÍSTICAS ↗</small></button>`).join('')}</div>`:'<div class="empty-state"><b>Este equipo todavía no tiene jugadores</b><small>El plantel aparecerá acá cuando se carguen jugadores desde Administración.</small></div>';openDetail(c.name,`PLANTEL · ${squad.length} JUGADORES`,body);}
function openPlayer(index){const p=players()[index];if(!p)return;const entries=Object.entries(p.stats||{}).filter(([k,v])=>v!==''&&v!==null&&v!==undefined);const body=entries.length?`<div class="player-stats-grid">${entries.map(([k,v])=>`<div class="player-stat"><span>${esc(statLabel(k))}</span><b>${esc(v)}</b></div>`).join('')}</div>`:'<div class="empty-state"><b>Estadísticas todavía no cargadas</b><small>El administrador puede completar los atributos PES 6 al agregar o editar el jugador.</small></div>';openDetail(p.name,`${p.position||'SIN POSICIÓN'} · ${p.club}`,body);}
function renderNews(){let ns=get('news',[]);let cards=ns.map(n=>`<article class="panel news-card">${n.image?`<img src="${n.image}" alt="">`:''}<small>${esc(n.date)}</small><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join('')||'<div class="panel empty-state"><b>Todavía no hay noticias publicadas</b><small>Las novedades oficiales aparecerán acá.</small></div>';document.getElementById('newsPublic').innerHTML=cards;document.getElementById('adminNewsList').innerHTML=ns.map((n,i)=>`<div class="admin-row news-admin-row"><b>${esc(n.title)}</b><button data-editnews="${i}" class="approve-btn">Editar</button><button data-delnews="${i}" class="danger-btn">Eliminar</button></div>`).join('');}
document.getElementById('addClub').addEventListener('click',()=>{let name=document.getElementById('clubNameInput').value.trim(),file=document.getElementById('clubLogoInput').files[0];if(!name)return alert('Ingresá el nombre del equipo.');let save=logo=>{let cs=clubs();if(cs.some(c=>c.name.toLowerCase()===name.toLowerCase()))return alert('Ese equipo ya existe.');cs.push({name,logo});set('clubs',cs);document.getElementById('clubNameInput').value='';renderAll();};if(file){let r=new FileReader();r.onload=()=>save(r.result);r.readAsDataURL(file);}else save('');});
document.getElementById('addPlayer').addEventListener('click',()=>{let name=document.getElementById('playerNameInput').value.trim(),club=document.getElementById('playerClubInput').value,position=document.getElementById('playerPositionInput').value.trim();if(!name||!club)return alert('Completá jugador y club.');let stats={};document.querySelectorAll('.player-stat-input').forEach(input=>{if(input.value!=='')stats[input.dataset.stat]=Math.max(1,Math.min(99,Number(input.value)));});let a=players();a.push({name,club,position,stats});set('players',a);renderAll();document.getElementById('playerNameInput').value='';document.getElementById('playerPositionInput').value='';document.querySelectorAll('.player-stat-input').forEach(input=>input.value='');});
document.getElementById('addRequest').addEventListener('click',()=>{let detail=document.getElementById('requestDetail').value.trim();if(!detail)return alert('Escribí el detalle de la solicitud.');let a=requests();a.unshift({type:document.getElementById('requestType').value,detail,status:'pendiente',date:new Date().toLocaleString('es-AR')});set('requests',a);document.getElementById('requestDetail').value='';renderAll();});
document.getElementById('applyMoney').addEventListener('click',()=>{let club=document.getElementById('moneyClub').value,amount=Number(document.getElementById('moneyAmount').value),action=document.getElementById('moneyAction').value,reason=document.getElementById('moneyReason').value.trim();if(!club||!amount||amount<1)return alert('Elegí un club e ingresá un monto válido.');let b=budgets(),before=Number(b[club]||0);if(action==='remove'&&amount>before)return alert('El club no tiene presupuesto suficiente en esta demo.');b[club]=before+(action==='add'?amount:-amount);set('budgets',b);let hist=get('moneyHistory',[]);hist.unshift({club,amount,action,reason,date:new Date().toLocaleString('es-AR')});set('moneyHistory',hist);document.getElementById('moneyMsg').textContent=`Movimiento registrado. Nuevo saldo: $${b[club].toLocaleString('es-AR')}`;document.getElementById('moneyAmount').value='';document.getElementById('moneyReason').value='';renderAll();});
document.getElementById('publishNews').addEventListener('click',()=>{let title=document.getElementById('newsTitle').value.trim(),body=document.getElementById('newsBody').value.trim(),file=document.getElementById('newsImage').files[0],editValue=document.getElementById('newsEditIndex').value;if(!title||!body)return alert('Completá título y contenido.');let save=image=>{let ns=get('news',[]),editing=editValue!=='';if(editing){let i=Number(editValue);if(ns[i])ns[i]={...ns[i],title,body,image:image||ns[i].image||'',date:new Date().toLocaleDateString('es-AR')};}else ns.unshift({title,body,image,date:new Date().toLocaleDateString('es-AR')});set('news',ns);document.getElementById('newsTitle').value='';document.getElementById('newsBody').value='';document.getElementById('newsImage').value='';document.getElementById('newsEditIndex').value='';document.getElementById('publishNews').textContent='PUBLICAR NOTICIA';document.getElementById('newsFormMode').textContent='';renderNews();};if(file){let r=new FileReader();r.onload=()=>save(r.result);r.readAsDataURL(file);}else save('');});
document.addEventListener('click',e=>{let t=e.target;if(t.dataset.delclub!==undefined){let a=clubs(),club=a[+t.dataset.delclub];if(!club)return;if(!confirm(`¿Eliminar el equipo ${club.name}? También se quitarán sus jugadores registrados y su presupuesto de esta demo.`))return;a.splice(+t.dataset.delclub,1);set('clubs',a);set('players',players().filter(p=>p.club!==club.name));let b=budgets();delete b[club.name];set('budgets',b);renderAll();}if(t.dataset.delplayer!==undefined){let a=players();a.splice(+t.dataset.delplayer,1);set('players',a);renderAll();}if(t.dataset.approve!==undefined||t.dataset.reject!==undefined){let i=+(t.dataset.approve??t.dataset.reject),a=requests();a[i].status=t.dataset.approve!==undefined?'aprobada':'rechazada';set('requests',a);renderAll();}if(t.dataset.editnews!==undefined){let i=+t.dataset.editnews,n=get('news',[])[i];if(!n)return;document.getElementById('newsTitle').value=n.title;document.getElementById('newsBody').value=n.body;document.getElementById('newsEditIndex').value=String(i);document.getElementById('publishNews').textContent='GUARDAR CAMBIOS';document.getElementById('newsFormMode').textContent='Editando: '+n.title;document.getElementById('newsTitle').scrollIntoView({behavior:'smooth',block:'center'});}if(t.dataset.delnews!==undefined){let a=get('news',[]);a.splice(+t.dataset.delnews,1);set('news',a);renderNews();}});
document.addEventListener('change',e=>{if(e.target.dataset.move!==undefined){let a=players();a[+e.target.dataset.move].club=e.target.value;set('players',a);renderAll();}});
renderAll();

// Acceso de jugadores (prototipo local; no sustituye autenticación online).
function playerAccounts(){return get('accounts',[])}
function updateAccountUI(){const user=get('currentUser',null);document.getElementById('accountLoggedOut').hidden=!!user;document.getElementById('accountLoggedIn').hidden=!user;document.getElementById('accountButton').textContent=user?`👤 ${user.username}`:'👤 INICIAR SESIÓN';if(user)document.getElementById('welcomeAccount').textContent=`Hola, ${user.username}. Tu club asignado es ${user.club}.`;const opts=clubs().map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');document.getElementById('registerClub').innerHTML='<option value="">Seleccioná tu club</option>'+opts;}
document.getElementById('playerRegister').addEventListener('click',()=>{const username=document.getElementById('registerUsername').value.trim(),password=document.getElementById('registerPassword').value,club=document.getElementById('registerClub').value;const msg=document.getElementById('registerMessage');if(!username||!password||!club){msg.textContent='Completá usuario, contraseña y club.';return;}if(password.length<6){msg.textContent='La contraseña debe tener al menos 6 caracteres.';return;}const a=playerAccounts();if(a.some(x=>x.username.toLowerCase()===username.toLowerCase())){msg.textContent='Ese usuario ya existe.';return;}a.push({username,password,club});set('accounts',a);msg.textContent='Cuenta creada. Ya podés iniciar sesión.';document.getElementById('loginUsername').value=username;});
document.getElementById('playerLogin').addEventListener('click',()=>{const username=document.getElementById('loginUsername').value.trim(),password=document.getElementById('loginPassword').value;const account=playerAccounts().find(x=>x.username.toLowerCase()===username.toLowerCase()&&x.password===password);const msg=document.getElementById('loginMessage');if(!account){msg.textContent='Usuario o contraseña incorrectos.';return;}set('currentUser',{username:account.username,club:account.club});msg.textContent='';updateAccountUI();renderMarket();});
document.getElementById('playerLogout').addEventListener('click',()=>{localStorage.removeItem('it_currentUser');updateAccountUI();renderMarket();});
updateAccountUI();

document.getElementById('playerSearch').addEventListener('input',renderPublicPlayers);
document.addEventListener('click',e=>{const t=e.target.closest('[data-openclub],[data-openplayer],[data-close-modal]');if(!t)return;if(t.hasAttribute('data-openclub'))openClub(Number(t.dataset.openclub));if(t.hasAttribute('data-openplayer'))openPlayer(Number(t.dataset.openplayer));if(t.hasAttribute('data-close-modal')){const m=document.getElementById('detailModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');}});

/* FIX: abrir fichas de clubes y jugadores antes de que otros manejadores intercepten el clic. */
document.addEventListener('click',function(ev){
 const trigger=ev.target.closest('[data-openplayer],[data-openclub],[data-close-modal]');
 if(!trigger)return;
 if(trigger.hasAttribute('data-openplayer')){
   ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
   openPlayer(Number(trigger.getAttribute('data-openplayer')));
 } else if(trigger.hasAttribute('data-openclub')){
   ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
   openClub(Number(trigger.getAttribute('data-openclub')));
 } else if(trigger.hasAttribute('data-close-modal')){
   ev.preventDefault();
   const modal=document.getElementById('detailModal');
   modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
 }
},true);

document.addEventListener('click',function(ev){
 const card=ev.target.closest('[data-draw-category]');
 if(!card)return;
 document.querySelectorAll('[data-draw-category]').forEach(x=>x.classList.toggle('selected',x===card));
 const labels={drop:'DROP PLAYER',premio:'PREMIO RULETA',top:'PAGO RULETA TOP'};
 const label=labels[card.dataset.drawCategory];
 document.getElementById('drawCategoryContent').innerHTML=`<div class="empty-state"><span>✦</span><b>${label}</b><small>Esta categoría está lista. Los sorteos y premios que se publiquen aparecerán acá.</small></div>`;
});

/* Mercado comunitario: publicaciones creadas por cuentas de jugadores. */
function marketPosts(){return get('marketPosts',[])}
function activePlayer(){return get('currentUser',null)}
function ownClubPlayers(){
 const u=activePlayer(); return u ? players().filter(p=>p.club===u.club) : [];
}
function fillMarketPlayerSelects(){
 const u=activePlayer();
 ['salePlayerSelect','loanPlayerSelect'].forEach(id=>{
  const el=document.getElementById(id); if(!el)return;
  const own=ownClubPlayers();
  el.innerHTML=own.length?own.map((p,i)=>`<option value="${esc(p.name)}">${esc(p.name)} · ${esc(p.position||'Sin posición')}</option>`).join(''):'<option value="">Tu club todavía no tiene jugadores cargados</option>';
 });
}
function renderMarket(){
 const u=activePlayer();
 document.getElementById('saleLoginNotice').hidden=!!u;
 document.getElementById('salePublishForm').hidden=!u;
 document.getElementById('loanLoginNotice').hidden=!!u;
 document.getElementById('loanPublishForm').hidden=!u;
 fillMarketPlayerSelects();
 const posts=marketPosts();
 const sale=posts.filter(p=>p.category==='venta'&&p.status==='publicada');
 const loan=posts.filter(p=>p.category==='prestamo'&&p.status==='publicada');
 const card=p=>`<article class="market-card">
  <div class="market-card-top"><span class="market-tag">${esc(p.kind|| (p.category==='venta'?'EN VENTA':'DISPONIBLE'))}</span><small>${esc(p.date||'')}</small></div>
  <h3>${esc(p.player)}</h3><p class="market-card-meta">${esc(p.position||'Sin posición')} · ${esc(p.club)}</p>
  ${p.price!==''&&p.price!==undefined?`<div class="market-price">$${Number(p.price).toLocaleString('es-AR')}</div>`:''}
  <p class="market-card-details">${esc(p.details||'Sin condiciones adicionales.')}</p>
  <div class="market-card-footer"><span>Publicado por <b>${esc(p.owner)}</b></span>${u&&u.username!==p.owner?`<button class="primary market-request-btn" data-market-request="${esc(p.id)}">SOLICITAR NEGOCIACIÓN</button>`:''}${u&&u.username===p.owner?`<button class="danger-btn" data-market-delete="${esc(p.id)}">RETIRAR PUBLICACIÓN</button>`:''}</div>
 </article>`;
 document.getElementById('saleListings').innerHTML=sale.map(card).join('')||'<div class="empty-state"><b>No hay jugadores publicados</b><small>Cuando un club publique una venta, aparecerá acá.</small></div>';
 document.getElementById('loanListings').innerHTML=loan.map(card).join('')||'<div class="empty-state"><b>No hay publicaciones activas</b><small>Las propuestas de préstamo e intercambio aparecerán acá.</small></div>';
}
function publishMarketPost(category){
 const u=activePlayer(); if(!u){alert('Iniciá sesión para publicar.');return;}
 const isSale=category==='venta';
 const playerName=document.getElementById(isSale?'salePlayerSelect':'loanPlayerSelect').value;
 const player=ownClubPlayers().find(p=>p.name===playerName);
 if(!player){alert('No hay un jugador válido de tu plantel para publicar.');return;}
 const details=document.getElementById(isSale?'saleDetails':'loanDetails').value.trim();
 const price=isSale?document.getElementById('salePrice').value:'';
 if(isSale&&price==='' ){alert('Ingresá el precio solicitado.');return;}
 if(!details&& !isSale){alert('Indicá las condiciones del préstamo o intercambio.');return;}
 const kind=isSale?'Venta':document.getElementById('loanKind').value;
 const posts=marketPosts();
 posts.unshift({id:'mp_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),category,kind,player:player.name,position:player.position||'',club:u.club,owner:u.username,price,details,status:'publicada',date:new Date().toLocaleString('es-AR')});
 set('marketPosts',posts);
 document.getElementById(isSale?'saleDetails':'loanDetails').value='';
 if(isSale)document.getElementById('salePrice').value='';
 document.getElementById(isSale?'salePublishMsg':'loanPublishMsg').textContent='Publicación visible en el mercado.';
 renderMarket();
}
document.getElementById('publishSale').addEventListener('click',()=>publishMarketPost('venta'));
document.getElementById('publishLoan').addEventListener('click',()=>publishMarketPost('prestamo'));
document.addEventListener('click',ev=>{
 const requestBtn=ev.target.closest('[data-market-request]');
 if(requestBtn){
  const u=activePlayer(); if(!u){alert('Iniciá sesión para solicitar una negociación.');return;}
  const post=marketPosts().find(p=>p.id===requestBtn.dataset.marketRequest);
  if(!post)return;
  if(post.owner===u.username){alert('No podés solicitar tu propia publicación.');return;}
  const req=requests();
  req.unshift({type:'NEGOCIACIÓN DE MERCADO',detail:`${u.username} (${u.club}) solicita negociar ${post.kind} por ${post.player} de ${post.club}. Publicación: ${post.id}.`,status:'pendiente',date:new Date().toLocaleString('es-AR'),marketPostId:post.id,fromUser:u.username,fromClub:u.club});
  set('requests',req); renderAll(); alert('Solicitud enviada a Administración para revisión.');
 }
 const delBtn=ev.target.closest('[data-market-delete]');
 if(delBtn){
  const u=activePlayer(), posts=marketPosts(), post=posts.find(p=>p.id===delBtn.dataset.marketDelete);
  if(!u||!post||post.owner!==u.username)return;
  set('marketPosts',posts.filter(p=>p.id!==post.id));renderMarket();
 }
});

renderMarket();
