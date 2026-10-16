const $=id=>document.getElementById(id), views=[...document.querySelectorAll('.view')];
const S={z:1,p:false};
try{Object.assign(S,JSON.parse(localStorage.getItem('euler')||'{}'))}catch(e){}
function applyUI(){
 const r=document.documentElement; r.style.setProperty('--z',S.p?S.z*1.35:S.z);
 S.p?r.setAttribute('data-p',''):r.removeAttribute('data-p');
 $('pj').textContent=S.p?'Salir del modo proyector':'Modo proyector';
 try{localStorage.setItem('euler',JSON.stringify(S))}catch(e){}
 if($('simulador').classList.contains('on'))draw();
}
$('zp').onclick=()=>{S.z=Math.min(1.6,+(S.z+.1).toFixed(1));applyUI()};
$('zm').onclick=()=>{S.z=Math.max(.8,+(S.z-.1).toFixed(1));applyUI()};
$('pj').onclick=()=>{S.p=!S.p;applyUI()};

/* ---- navegación por secciones ---- */
const ids=views.map(v=>v.id);
$('nav').innerHTML=views.map(v=>`<a href="#${v.id}">${v.dataset.t}</a>`).join('');
views.forEach((v,i)=>{
 if(v.id==='inicio')return;
 v.insertAdjacentHTML('beforeend',`<div class="pager"><button ${i?`onclick="go(${i-1})"`:'disabled style="opacity:.3"'}>← Anterior</button><button ${i<ids.length-1?`onclick="go(${i+1})"`:'disabled style="opacity:.3"'}>Siguiente →</button></div>`);
});
function go(i){location.hash=ids[i]}
function show(){
 const id=ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0];
 views.forEach(v=>v.classList.toggle('on',v.id===id));
 document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+id));
 document.body.classList.toggle('cover',id==='inicio');
 if($('cvbox').classList.contains('full')){$('cvbox').classList.remove('full');document.body.style.overflow='';$('zoomb').textContent='Ampliar gráfico'}
 scrollTo(0,0); if(id==='simulador')draw();
}
addEventListener('hashchange',show);
addEventListener('keydown',e=>{
 if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('cvbox').classList.contains('full'))return;
 const i=ids.indexOf(location.hash.slice(1)||ids[0]);
 if(e.key==='ArrowRight'&&i<ids.length-1)go(i+1);
 if(e.key==='ArrowLeft'&&i>0)go(i-1);
});
addEventListener('resize',()=>{if($('simulador').classList.contains('on'))drawChart()});

/* ---- fórmulas LaTeX (KaTeX) ---- */
function renderMath(el){
 if(!window.renderMathInElement)return;
 try{renderMathInElement(el||document.body,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false})}catch(e){}
}

/* ---- núcleo numérico ---- */
function parse(src){
 let e=src.replace(/\^/g,'**').replace(/\bsen\b/g,'sin').replace(/\bpi\b/gi,'PI').replace(/\bt\b/g,'x');
 if(!/^[\d\s+\-*\/().,a-zA-Z_]*$/.test(e))throw new Error('Caracteres no permitidos');
 (e.match(/[a-zA-Z_]+/g)||[]).forEach(w=>{if(!['x','y','PI','E'].includes(w)&&typeof Math[w]!=='function')throw new Error('No reconozco "'+w+'"')});
 const fn=new Function('x','y','with(Math){return ('+e+')}'); fn(1,1); return fn;
}
function euler(f,x0,y0,h,xf){
 const n=Math.round((xf-x0)/h), r=[{n:0,x:x0,y:y0,f:f(x0,y0)}];
 for(let i=0;i<n;i++){const p=r[i],x=x0+(i+1)*h,y=p.y+h*p.f;r.push({n:i+1,x,y,f:f(x,y)})}
 return r;
}
function ref(f,x0,y0,h,xf){ // RK4 con paso h/20, solo como referencia visual
 const n=Math.min(4000,Math.round((xf-x0)/h)*20),d=(xf-x0)/n,r=[[x0,y0]];let x=x0,y=y0;
 for(let i=0;i<n;i++){const a=f(x,y),b=f(x+d/2,y+d*a/2),c=f(x+d/2,y+d*b/2),e=f(x+d,y+d*c);y+=d*(a+2*b+2*c+e)/6;x=x0+(i+1)*d;r.push([x,y])}
 return r;
}
let DEC=4;const fm=v=>Number.isFinite(v)?v.toFixed(DEC):'∞',fx=v=>String(+v.toFixed(6));

/* ---- ejercicios generados con el mismo método ---- */
function buildEx(k,c){
 const v=c.v||'x',t=u=>u.toFixed(4),X=u=>u.toFixed(c.d||1),r=euler(c.f,c.x0,c.y0,c.h,c.xf),n=r.length-1;
 const why=i=>i==0?String.raw`Partimos del dato inicial del problema. Con la EDO calculamos la pendiente de la tangente en ese punto y avanzamos \(h\) sobre ella para obtener el primer punto aproximado.`
  :i==n-1?String.raw`Último paso: llegamos a \(${v}=${X(c.xf)}\), que es el punto pedido. El valor de \(y\) obtenido es la aproximación de \(y(${X(c.xf)})\).`
  :i==1?String.raw`El punto de partida ahora es el resultado de la iteración anterior (\(y\) ya no es exacto, es aproximado). Se vuelve a calcular la pendiente en ese punto y se avanza otro paso \(h\).`
  :String.raw`Mismo procedimiento: se actualiza la pendiente con el nuevo punto y se avanza. Cada paso arrastra el pequeño error de los anteriores.`;
 $('steps'+k).innerHTML=r.slice(0,n).map((p,i)=>{const q=r[i+1],last=i==n-1,res=last?String.raw`\boxed{${q.y.toFixed(5)}}`:t(q.y),mid=c.mid?'='+c.mid(p.x,p.y):'';
  return String.raw`<div class="step"><b>Iteración ${i+1}: calcular \(y_${i+1}\) en \(${v}_${i+1}=${X(q.x)}\)${last?' (respuesta)':''}</b>
<p class="why">${why(i)}</p>
\[\begin{aligned}
\text{(a) Punto actual:}\quad & ${v}_${i}=${X(p.x)},\ \ y_${i}=${t(p.y)}\\
\text{(b) Pendiente:}\quad & f(${v}_${i},y_${i})=${c.sym(i)}=${c.val(p.x,p.y)}${mid}=${t(p.f)}\\
\text{(c) Avance:}\quad & y_${i+1}=y_${i}+h\cdot f=${t(p.y)}+${c.h}\cdot ${t(p.f)}=${res}
\end{aligned}\]</div>`}).join('');
 $('sumtab'+k).innerHTML=String.raw`<tr><th>\(n\)</th><th>\(${v}_n\)</th><th>\(y_n\)</th><th>\(f(${v}_n,y_n)\)</th><th>\(y_{n+1}=y_n+h\cdot f\)</th></tr>`+
  r.slice(0,n).map((p,i)=>`<tr${i==n-1?' class="last"':''}><td>${i}</td><td>${X(p.x)}</td><td>${t(p.y)}</td><td>${t(p.f)}</td><td>${i==n-1?String.raw`\(y(${X(c.xf)})\approx ${t(r[n].y)}\)`:t(r[i+1].y)}</td></tr>`).join('');
 const ex=c.exact(c.xf),er=Math.abs(ex-r[n].y);
 $('cmp'+k).innerHTML=String.raw`<b>Resultado:</b> \(y(${X(c.xf)})\approx ${r[n].y.toFixed(5)}\). <b>Comparación:</b> la solución exacta de este PVI es \(${c.exTex}\), que da \(y(${X(c.xf)})=${ex.toFixed(5)}\). El error absoluto es \(${er.toFixed(5)}\), razonable para \(h=${c.h}\); con un \(h\) más chico el error disminuye.`;
}
buildEx(1,{f:(x,y)=>x*x+y,x0:0,y0:1,h:.1,xf:.4,
 sym:i=>String.raw`x_${i}^2+y_${i}`,val:(x,y)=>String.raw`${x.toFixed(1)}^2+${y.toFixed(4)}`,
 exact:x=>3*Math.exp(x)-x*x-2*x-2,exTex:String.raw`y(x)=3e^{x}-x^2-2x-2`});
buildEx(2,{v:'t',f:(x,y)=>Math.sin(x)+Math.exp(-x),x0:0,y0:0,h:.5,xf:1,
 sym:i=>String.raw`\sin(t_${i})+e^{-t_${i}}`,val:(x,y)=>String.raw`\sin(${x.toFixed(1)})+e^{-${x.toFixed(1)}}`,
 mid:(x,y)=>String.raw`${Math.sin(x).toFixed(4)}+${Math.exp(-x).toFixed(4)}`,
 exact:x=>2-Math.cos(x)-Math.exp(-x),exTex:String.raw`y(t)=2-\cos t-e^{-t}`});
buildEx(3,{f:(x,y)=>(x-y)**2,x0:2,y0:.5,h:.25,xf:2.75,d:2,
 sym:i=>String.raw`(x_${i}-y_${i})^2`,val:(x,y)=>String.raw`(${x.toFixed(2)}-${y.toFixed(4)})^2`,
 mid:(x,y)=>String.raw`${(x-y).toFixed(4)}^2`,
 exact:x=>x-1/Math.tanh(x-2+Math.log(5)/2),exTex:String.raw`y(x)=x-\coth\!\left(x-2+\tfrac{1}{2}\ln 5\right)`});
$('exsub').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 document.querySelectorAll('#exsub button').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('.ex').forEach(x=>x.classList.toggle('on',x.id==='ex'+b.dataset.k));scrollTo(0,0)};

/* ---- simulador ---- */
const PRE=[
 ['Ejemplo de la clase: y\' = x² + y, y(0)=1','x^2 + y',0,1,.4,.1,'3*exp(x) - x^2 - 2*x - 2'],
 ['Práctica 2a: y\' = −y + x + 1, y(0)=1','-y + x + 1',0,1,1,.1,'x + exp(-x)'],
 ['Práctica 2b: y\' = sen(t) + e^(−t), y(0)=0','sin(x) + exp(-x)',0,0,1,.5,'2 - cos(x) - exp(-x)','t'],
 ['Práctica 2c: y\' = (x − y)², y(2)=0.5','(x - y)^2',2,.5,2.75,.25,'x - 1/tanh(x - 2 + log(5)/2)'],
 ['Práctica 2d: y\' = x·y² − y/x, y(1)=1','x*y^2 - y/x',1,1,1.5,.1],
 ['Práctica 2e: y\' = 2x − 3y + 1, y(1)=5','2*x - 3*y + 1',1,5,1.5,.1,'2*x/3 + 1/9 + 38/9*exp(3 - 3*x)'],
 ['Apunte: y\' = 2xy, y(1)=1','2*x*y',1,1,1.3,.1,'exp(x^2 - 1)']];
$('pre').innerHTML='<option value="-1">✏️ Datos propios (casillas vacías)</option>'+PRE.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
$('pre').value='0';
function setLabels(){const v=$('var').value,n=$('mode').value==='n';
 $('lf').innerHTML=`f(<i>${v}</i>, <i>y</i>) =`;$('lx0').innerHTML=`<i>${v}</i><sub>0</sub>`;$('ly0').innerHTML=`<i>y</i><sub>0</sub> = y(<i>${v}</i><sub>0</sub>)`;
 $('lxf').innerHTML=n?'N° de iteraciones <i>n</i>':`<i>${v}</i> final`;$('xf').placeholder=n?'ej: 4':'ej: 0.4'}
function clearOut(){D=null;VIEW=null;$('msg').className='';$('msg').textContent='Completá los datos y tocá Calcular.';
 const c=$('cv');c.getContext('2d').clearRect(0,0,c.width,c.height);$('tab').innerHTML='';$('steps').innerHTML=''}
$('pre').onchange=()=>{const k=+$('pre').value,p=k<0?['','','','','','','']:PRE[k];
 $('mode').value='xf';if(k>=0)$('var').value=p[7]||'x';setLabels();
 ['f','x0','y0','xf','h'].forEach((q,i)=>$(q).value=p[i+1]);$('ex').value=p[6]||'';
 if(k<0){clearOut();$('stwrap').style.display='none';$('f').focus()}else calc()};
$('mode').onchange=()=>{const x0=+$('x0').value,h=+$('h').value,v=+$('xf').value;
 if($('xf').value.trim()!==''&&h>0&&Number.isFinite(x0)&&Number.isFinite(v))$('xf').value=$('mode').value==='n'?Math.round((v-x0)/h):+(x0+v*h).toFixed(8);
 setLabels()};
$('var').onchange=()=>{setLabels();calc()};
['dec','chref','chst'].forEach(k=>$(k).onchange=draw);
['f','x0','y0','xf','h','ex'].forEach(k=>{$(k).addEventListener('input',()=>{$('pre').value='-1'});$(k).addEventListener('keydown',e=>{if(e.key==='Enter')calc()})});
$('clr').onclick=()=>{$('pre').value='-1';$('pre').onchange()};
$('run').onclick=calc;
function toggleFull(on){
 const bx=$('cvbox');on=on===undefined?!bx.classList.contains('full'):on;
 bx.classList.toggle('full',on);document.body.style.overflow=on?'hidden':'';
 $('zoomb').textContent=on?'Cerrar (Esc)':'Ampliar gráfico';drawChart();
}
$('zoomb').onclick=()=>toggleFull();
addEventListener('keydown',e=>{if(e.key==='Escape'&&$('cvbox').classList.contains('full'))toggleFull(false)});
let D=null;
function compute(){
 const g=k=>$(k).value.trim(),ks=['f','x0','y0','xf','h'];
 if(ks.every(k=>g(k)===''))return null;
 if(ks.some(k=>g(k)===''))throw new Error('Completá todas las casillas (f, punto inicial, y₀, paso h y hasta dónde llegar) y tocá Calcular');
 const nm=$('mode').value==='n',x0=+g('x0'),y0=+g('y0'),h=+g('h'),q=+g('xf'),xf=nm?x0+q*h:q;
 if(![x0,y0,xf,h].every(Number.isFinite)||h<=0||xf<=x0)throw new Error(nm?'Revisá los datos: h > 0 y n ≥ 1':'Revisá los datos: h > 0 y el valor final debe ser mayor que el inicial');
 if(nm&&(!Number.isInteger(q)||q<1))throw new Error('El número de iteraciones n debe ser un entero ≥ 1');
 if((xf-x0)/h>2000)throw new Error('Demasiados pasos (máx. 2000): aumentá h');
 const f=parse(g('f')),fe=g('ex')?parse(g('ex')):null;
 return {x0,y0,xf,h,fe,E:euler(f,x0,y0,h,xf),R:ref(f,x0,y0,h,xf)};
}
function draw(){
 const m=$('msg'),c=$('cv'),g=c.getContext('2d'),cs=getComputedStyle(document.documentElement),v=$('var').value;
 DEC=+$('dec').value;
 try{D=compute()}catch(e){m.className='err';m.textContent=e.message;$('stwrap').style.display='none';return}
 if(!D){clearOut();$('stwrap').style.display='none';return}
 const {E,R,fe,h}=D,last=E[E.length-1],rl=R[R.length-1],drawRef=!!fe||$('chref').checked,
  Rx=fe?R.map(q=>({x:q[0],y:fe(q[0],0)})):R.map(q=>({x:q[0],y:q[1]})),
  base=fe?fe(last.x,0):rl[1],pts=E.concat(drawRef?Rx:[]).filter(p=>Number.isFinite(p.y)),n=E.length-1;
 m.className='';
 if(!Number.isFinite(last.y)){m.className='err';m.textContent='El método diverge: probá un paso h más chico.'}
 else m.innerHTML=`Euler: y(${fx(last.x)}) ≈ <span style="color:var(--ok)">${fm(last.y)}</span> · ${fe?'Solución exacta':'Referencia (RK4 fino)'}: ${fm(base)} · Error absoluto: ${fm(Math.abs(last.y-base))} · ${n} iteraciones`;
 $('tab').innerHTML=String.raw`<tr><th>\(n\)</th><th>\(${v}_n\)</th><th>\(y_n\)</th><th>\(f(${v}_n,y_n)\)</th><th>\(y_{n+1}\)</th>${fe?String.raw`<th>\(y(${v}_n)\) exacta</th><th>Error \(|y(${v}_n)-y_n|\)</th>`:''}</tr>`+E.map((p,i)=>`<tr${i==n?' class="last"':''}><td>${p.n}</td><td>${fx(p.x)}</td><td>${fm(p.y)}</td><td>${fm(p.f)}</td><td>${i<n?fm(E[i+1].y):'—'}</td>${fe?`<td>${fm(fe(p.x,0))}</td><td>${fm(Math.abs(fe(p.x,0)-p.y))}</td>`:''}</tr>`).join('');
 renderMath($('tab'));
 const st=$('chst').checked&&Number.isFinite(last.y);$('stwrap').style.display=st?'':'none';
 if(st){
  $('steps').innerHTML=n>25?`<p>El desarrollo paso a paso se muestra hasta 25 iteraciones (ahora hay ${n}). Usá un paso h más grande para verlo.</p>`
  :E.slice(0,n).map((p,i)=>{const q=E[i+1],lst=i==n-1,t=u=>u.toFixed(DEC);
   return String.raw`<div class="step"><b>Iteración ${i+1}: calcular \(y_{${i+1}}\) en \(${v}_{${i+1}}=${fx(q.x)}\)${lst?' (respuesta)':''}</b>
\[\begin{aligned}
\text{(a) Punto actual:}\quad & ${v}_{${i}}=${fx(p.x)},\ \ y_{${i}}=${t(p.y)}\\
\text{(b) Pendiente:}\quad & f(${v}_{${i}},y_{${i}})=f(${fx(p.x)},\,${t(p.y)})=${t(p.f)}\\
\text{(c) Avance:}\quad & y_{${i+1}}=y_{${i}}+h\cdot f=${t(p.y)}+${h}\cdot ${t(p.f)}=${lst?String.raw`\boxed{${t(q.y)}}`:t(q.y)}
\end{aligned}\]</div>`}).join('');
  renderMath($('steps'));
 }
 D.v=v;D.Rx=Rx;D.drawRef=drawRef;D.fit=fitView(pts);
 drawChart();
}

/* ---- gráfico interactivo: mover (arrastrar) y zoom (rueda, pellizco o botones) ---- */
let VIEW=null; // null = vista automática; si no, {a,b,lo,hi} en coordenadas del problema
const M={L:60,T:15,B:34,R:15};
function calc(){VIEW=null;draw()}
function fitView(pts){
 const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);let a=Math.min(...xs),b=Math.max(...xs),lo=Math.min(...ys),hi=Math.max(...ys);
 if(hi===lo){hi+=1;lo-=1}const pad=(hi-lo)*.1;return{a,b,lo:lo-pad,hi:hi+pad};
}
const curView=()=>VIEW||(D&&D.fit);
function niceTicks(lo,hi,n){
 const raw=(hi-lo)/n,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p,s=(f<1.5?1:f<3?2:f<7?5:10)*p,r=[];
 for(let t=Math.ceil(lo/s-1e-9)*s;t<=hi+s*1e-9;t+=s)r.push(+t.toPrecision(12));
 return{r,s};
}
const tickTxt=(t,s)=>Math.abs(t)>=1e7||(t!==0&&Math.abs(t)<1e-6)?t.toExponential(2):t.toFixed(Math.min(10,Math.max(0,-Math.floor(Math.log10(s)+1e-9))));
function drawChart(hv){
 if(!D||!D.fit)return;
 D.hv=hv===undefined?-1:hv;
 const c=$('cv'),g=c.getContext('2d'),cs=getComputedStyle(document.documentElement),{E,Rx,drawRef,fe}=D;
 const dpr=devicePixelRatio||1,W=c.clientWidth,H=c.clientHeight;
 if(!W||!H)return;
 c.width=W*dpr;c.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0);
 const {a,b,lo,hi}=curView(),{L,T,B,R:Rr}=M,pw=W-L-Rr,ph=H-T-B,p=S.p||$('cvbox').classList.contains('full'),lw=p?4:2.5;
 const X=u=>L+(u-a)/(b-a)*pw,Y=u=>T+(hi-u)/(hi-lo)*ph;
 g.clearRect(0,0,W,H);g.font=(p?15:12)+'px sans-serif';
 const tx=niceTicks(a,b,6),ty=niceTicks(lo,hi,6);
 g.strokeStyle='#ddd';g.lineWidth=1;g.beginPath();
 tx.r.forEach(t=>{g.moveTo(X(t),T);g.lineTo(X(t),H-B)});ty.r.forEach(t=>{g.moveTo(L,Y(t));g.lineTo(W-Rr,Y(t))});g.stroke();
 g.fillStyle='#000';g.textAlign='center';tx.r.forEach(t=>g.fillText(tickTxt(t,tx.s),X(t),H-B+16));
 g.textAlign='right';ty.r.forEach(t=>g.fillText(tickTxt(t,ty.s),L-5,Y(t)+4));
 g.strokeStyle='#000';g.lineWidth=1.5;g.strokeRect(L,T,pw,ph);
// ejes x e y (pasan por 0 si está en la vista; si no, quedan sobre el borde)
 const ax=Math.min(Math.max(X(0),L),L+pw),ay=Math.min(Math.max(Y(0),T),T+ph),vn=$('var').value;
 g.strokeStyle='#000';g.lineWidth=p?3:2;g.beginPath();g.moveTo(L,ay);g.lineTo(L+pw,ay);g.moveTo(ax,T);g.lineTo(ax,T+ph);g.stroke();
 g.fillStyle='#000';g.font='italic bold '+(p?17:14)+'px sans-serif';g.textAlign='right';g.fillText(vn,L+pw-6,Math.min(ay+16,T+ph-4)>ay?ay+16:ay-6);
 g.textAlign='left';g.fillText('y',Math.min(ax+6,L+pw-12),T+14);g.font=(p?15:12)+'px sans-serif';
 g.save();g.beginPath();g.rect(L,T,pw,ph);g.clip();
 const line=(arr,col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.beginPath();let on=false;
  arr.forEach(q=>{if(!Number.isFinite(q.y)){on=false;return}on?g.lineTo(X(q.x),Y(q.y)):g.moveTo(X(q.x),Y(q.y));on=true});g.stroke()};
 const ac2=cs.getPropertyValue('--ac2').trim();
 if(drawRef)line(Rx,ac2,lw);
 line(E,'#e91e63',lw);
 g.fillStyle='#e91e63';E.forEach((q,i)=>{if(!Number.isFinite(q.y))return;g.beginPath();g.arc(X(q.x),Y(q.y),i===D.hv?(p?9:7):(p?6:4),0,7);g.fill();
  if(i===D.hv){g.strokeStyle='#000';g.lineWidth=2;g.stroke()}});
 g.restore();
 let ly=T+18;g.textAlign='left';
 if(drawRef){g.fillStyle=ac2;g.fillText(fe?'━ Solución exacta':'━ Solución de referencia',L+10,ly);ly+=20}
 g.fillStyle='#e91e63';g.fillText('━● Aproximación de Euler',L+10,ly);
}
const cv=$('cv'),tip=$('tip'),ptrs=new Map();let pinch=null;
const rel=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const geo=()=>{const W=cv.clientWidth,H=cv.clientHeight;return{W,H,pw:W-M.L-M.R,ph:H-M.T-M.B,v:curView()}};
function setView(a,b,lo,hi){ // limita el zoom para no perder la precisión
 const f=D.fit,sx=f.b-f.a,sy=f.hi-f.lo,nx=b-a,ny=hi-lo;
 if(!(nx>0&&ny>0)||!Number.isFinite(a+b+lo+hi))return;
 if(nx<sx*1e-6||nx>sx*200||ny<sy*1e-6||ny>sy*200)return;
 VIEW={a,b,lo,hi};
}
function zoomAt(px,py,fx,fy){
 const {pw,ph,v}=geo(),cx=v.a+(px-M.L)/pw*(v.b-v.a),cy=v.hi-(py-M.T)/ph*(v.hi-v.lo);
 setView(cx-(cx-v.a)*fx,cx+(v.b-cx)*fx,cy-(cy-v.lo)*fy,cy+(v.hi-cy)*fy);
 drawChart();
}
function panBy(dx,dy){
 const {pw,ph,v}=geo(),sx=(v.b-v.a)/pw,sy=(v.hi-v.lo)/ph;
 VIEW={a:v.a-dx*sx,b:v.b-dx*sx,lo:v.lo+dy*sy,hi:v.hi+dy*sy};
 drawChart();
}
const hideTip=()=>{tip.style.display='none'};
function showTip(i,q){
 if(i<0){hideTip();return}
 const p=D.E[i],v=D.v,fe=D.fe;
 let t=`<b>n = ${p.n}</b> · ${v}<sub>${p.n}</sub> = ${fx(p.x)}<br>y<sub>${p.n}</sub> = ${fm(p.y)}`;
 if(fe){const ye=fe(p.x,0);t+=`<br>exacta = ${fm(ye)} · error = ${fm(Math.abs(ye-p.y))}`}
 tip.innerHTML=t;tip.style.display='block';
 let l=cv.offsetLeft+q.x+14,tp=cv.offsetTop+q.y+14;
 if(q.x+14+tip.offsetWidth>cv.clientWidth)l=cv.offsetLeft+q.x-14-tip.offsetWidth;
 if(q.y+14+tip.offsetHeight>cv.clientHeight)tp=cv.offsetTop+q.y-14-tip.offsetHeight;
 tip.style.left=l+'px';tip.style.top=tp+'px';
}
function hover(q){
 const {pw,ph,v}=geo();let best=-1,bd=14;
 if(q.x>=M.L&&q.x<=M.L+pw&&q.y>=M.T&&q.y<=M.T+ph)
  D.E.forEach((p,i)=>{if(!Number.isFinite(p.y))return;
   const d=Math.hypot(M.L+(p.x-v.a)/(v.b-v.a)*pw-q.x,M.T+(v.hi-p.y)/(v.hi-v.lo)*ph-q.y);if(d<bd){bd=d;best=i}});
 if(best!==D.hv)drawChart(best);
 showTip(best,q);
}
cv.addEventListener('wheel',e=>{
 if(!D||!D.fit)return;e.preventDefault();hideTip();
 const q=rel(e),{H}=geo(),dd=e.deltaY||e.deltaX,f=Math.min(2,Math.max(.5,Math.exp(dd*(e.deltaMode===1?.05:.0015))));
 const onlyX=e.shiftKey||q.y>H-M.B,onlyY=e.altKey||q.x<M.L;
 zoomAt(q.x,q.y,onlyY?1:f,onlyX?1:f);
},{passive:false});
cv.addEventListener('pointerdown',e=>{
 if(!D||!D.fit)return;
 try{cv.setPointerCapture(e.pointerId)}catch(_){}
 ptrs.set(e.pointerId,rel(e));hideTip();cv.classList.add('drag');
 if(ptrs.size===2){const [p1,p2]=[...ptrs.values()];pinch={d:Math.hypot(p1.x-p2.x,p1.y-p2.y)||1,mx:(p1.x+p2.x)/2,my:(p1.y+p2.y)/2}}
});
cv.addEventListener('pointermove',e=>{
 if(!D||!D.fit)return;
 const q=rel(e);
 if(ptrs.has(e.pointerId)){
  const prev=ptrs.get(e.pointerId);ptrs.set(e.pointerId,q);
  if(ptrs.size===1)panBy(q.x-prev.x,q.y-prev.y);
  else if(ptrs.size===2&&pinch){
   const [p1,p2]=[...ptrs.values()],d=Math.hypot(p1.x-p2.x,p1.y-p2.y)||1,mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2,f=pinch.d/d;
   zoomAt(mx,my,f,f);panBy(mx-pinch.mx,my-pinch.my);pinch={d,mx,my};
  }
 }else if(e.pointerType==='mouse')hover(q);
});
const endPtr=e=>{ptrs.delete(e.pointerId);pinch=null;if(!ptrs.size)cv.classList.remove('drag')};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('pointerleave',()=>{if(!ptrs.size&&D&&D.fit){hideTip();drawChart()}});
cv.addEventListener('dblclick',()=>{if(D&&D.fit){VIEW=null;drawChart()}});
const mid=()=>{const {pw,ph}=geo();return{x:M.L+pw/2,y:M.T+ph/2}};
$('zin').onclick=()=>{if(D&&D.fit){const c=mid();zoomAt(c.x,c.y,.7,.7)}};
$('zout').onclick=()=>{if(D&&D.fit){const c=mid();zoomAt(c.x,c.y,1/.7,1/.7)}};
$('zrs').onclick=()=>{if(D&&D.fit){VIEW=null;drawChart()}};
$('ex').value=PRE[0][6];setLabels();
applyUI();show();
addEventListener('load',()=>renderMath());
