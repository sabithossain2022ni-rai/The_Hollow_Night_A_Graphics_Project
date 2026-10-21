(()=>{
const W=1280,H=720,cv=document.getElementById('c'),x=cv.getContext('2d');cv.width=W;cv.height=H;
const M=Math,PI=M.PI,sin=M.sin,cos=M.cos,rnd=M.random;
const cl=(v,a=0,b=1)=>M.max(a,M.min(b,v)),lp=(a,b,t)=>a+(b-a)*t,sm=v=>{v=cl(v);return v*v*(3-2*v)};
const seed=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=M.imul(s^s>>>15,1|s);t=t+M.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const D=[60,70,80,85,80,75,80,70,85],OL=[1,24,26,26,24,24,24,24,30],K=D.map((d,i)=>d/OL[i]),S=D.reduce((a,d,i)=>(a.push(i?a[i-1]+D[i-1]-2:0),a),[]),END=S[8]+D[8];
let stalkN=0,T=0,flash=0,strike2=0,bolt=null,shake=0,paused=false,playing=false,mute=false,evI=0,sceneI=-1,silP=false,last=0;

/* ---------- film grain ---------- */
const nz=[0,1,2,3].map(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),d=g.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=rnd()*255;d.data[i+3]=255}g.putImageData(d,0,0);return c});
const pat=nz.map(c=>x.createPattern(c,'repeat'));

/* ---------- AUDIO (procedural) ---------- */
const AU={},AMB=[[.3,.3,.15,0],[.5,.6,.22,0],[.45,.5,.32,0],[.16,.25,.3,0],[0,.12,.5,0],[0,.08,.45,0],[.1,.1,.4,0],[.1,.35,.3,0],[0,.08,.5,.18]];
function initAudio(){
 const c=AU.c=new(window.AudioContext||window.webkitAudioContext)(),comp=c.createDynamicsCompressor(),m=AU.m=c.createGain();
 m.gain.value=.9;m.connect(comp);comp.connect(c.destination);
 const nb=AU.nb=c.createBuffer(1,c.sampleRate*3,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1;
 const loop=(type,f,q=1)=>{const s=c.createBufferSource();s.buffer=nb;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(m);s.start();return{g,f:fl}};
 AU.rain=loop('highpass',1800);AU.wind=loop('bandpass',450,3);AU.stat=loop('highpass',2500);
 const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.11;lg.gain.value=260;lfo.connect(lg);lg.connect(AU.wind.f.frequency);lfo.start();
 AU.drone=c.createGain();AU.drone.gain.value=0;const df=c.createBiquadFilter();df.type='lowpass';df.frequency.value=220;
 [55,55.6,82.7].forEach(f=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(df);o.start()});df.connect(AU.drone);AU.drone.connect(m);
}
const t0=()=>AU.c.currentTime;
function ns(at,dur,type,f,pk,att=.01,q=1){const c=AU.c,s=c.createBufferSource();s.buffer=AU.nb;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(pk,at+att);g.gain.exponentialRampToValueAtTime(.0001,at+att+dur);s.connect(fl);fl.connect(g);g.connect(AU.m);s.start(at,rnd()*1.5);s.stop(at+att+dur+.05)}
function tn(at,type,f1,f2,dur,pk,att=.01,filt){const c=AU.c,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f1,at);o.frequency.exponentialRampToValueAtTime(f2,at+dur);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(pk,at+att);g.gain.exponentialRampToValueAtTime(.0001,at+dur);let n=o;if(filt){const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=filt;f.Q.value=3;o.connect(f);n=f}n.connect(g);g.connect(AU.m);o.start(at);o.stop(at+dur+.05)}
const SFX={
 thunder(dl){const a=t0()+dl;ns(a,.25,'highpass',1800,.5,.003);ns(a+.1,4,'lowpass',500,1.3,.15);ns(a+.3,6,'lowpass',160,1.6,.4);tn(a,'sine',60,28,4,.9,.05)},
 caw(n){for(let i=0;i<n;i++)tn(t0()+i*.42,'sawtooth',620,360,.3,.25,.02,1100)},
 creak(d){const c=AU.c,a=t0(),o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';f.type='bandpass';f.Q.value=9;f.frequency.value=800;
  g.gain.setValueAtTime(0,a);g.gain.linearRampToValueAtTime(.2,a+.6);g.gain.linearRampToValueAtTime(0,a+d);o.frequency.setValueAtTime(110,a);
  for(let i=0;i<d*3;i++){o.frequency.linearRampToValueAtTime(70+rnd()*110,a+(i+1)/3);f.frequency.linearRampToValueAtTime(500+rnd()*900,a+(i+1)/3)}
  o.connect(f);f.connect(g);g.connect(AU.m);o.start(a);o.stop(a+d+.1)},
 knock(){const a=t0();ns(a,.1,'lowpass',300,1,.002);tn(a,'sine',140,60,.15,.9,.002)},
 step(){const a=t0();ns(a,.18,'lowpass',200,.8,.01);tn(a,'sine',70,40,.2,.6,.01)},
 heart(){const a=t0();tn(a,'sine',60,35,.2,1,.01);tn(a+.26,'sine',55,35,.2,.7,.01)},
 whisper(){const a=t0();for(let i=0;i<6;i++)ns(a+i*.35,.3,'bandpass',2200+rnd()*1800,.12,.1,5)},
 dig(){for(let i=0;i<7;i++)ns(t0()+i*.5+rnd()*.2,.35,'lowpass',500+rnd()*300,.5,.02)},
 rumble(){tn(t0(),'sine',40,25,7,.7,1.5)},
 box(){[440,523.3,659.3,587.3,523.3,493.9,440,392,440,0,523.3,493.9,440,415.3,440].forEach((f,i)=>{if(!f)return;const a=t0()+i*.5;tn(a,'sine',f,f*.998,1.6,.12,.005);tn(a,'sine',f*3,f*3,.5,.04,.002)})},
 puff(){ns(t0(),.4,'highpass',1200,.6,.02)},
 riser(){const a=t0();tn(a,'sawtooth',80,900,5,.18,3.5,500);ns(a,5,'bandpass',1500,.25,4,2)},
 scream(){const a=t0();tn(a,'sawtooth',700,1700,1.3,.5,.01,1500);tn(a,'sawtooth',930,2300,1.3,.4,.01,2200);tn(a,'square',200,90,1.2,.3,.01);ns(a,1.2,'highpass',1500,.7,.005)},
 buzz(){const a=t0();ns(a,.25,'bandpass',3000,.3,.005,4);tn(a,'sawtooth',100,95,.3,.12,.005)},
 breath(){const a=t0();for(let i=0;i<3;i++)ns(a+i*1.4,.9,'bandpass',900,.25,.5,1.5)},
 scratch(){const a=t0();for(let i=0;i<10;i++)ns(a+i*.08,.1,'highpass',3500,.18,.005)},
 drip(){tn(t0(),'sine',1900,700,.12,.25,.002)},
 glass(){const a=t0();ns(a,.6,'highpass',4000,.8,.001);for(let i=0;i<6;i++)tn(a+i*.03,'sine',3000+rnd()*3000,2000,.3,.15,.001)},
 giggle(){const a=t0();for(let i=0;i<5;i++)tn(a+i*.16,'triangle',900+rnd()*300,700,.12,.25,.01,1500)},
 roar(){const a=t0();tn(a,'sawtooth',110,45,1.6,.6,.02,300);ns(a,1.6,'lowpass',900,.9,.02)},
 zap(){ns(t0(),.7,'highpass',1500,.7,.002)}
};
const au=(f,...a)=>{if(AU.c&&SFX[f])SFX[f](...a)};
function setAmb(i,sil){if(!AU.c)return;const v=sil?[0,0,0,0]:AMB[i],tc=AU.c.currentTime;
 [[AU.rain.g.gain,.35],[AU.wind.g.gain,.5],[AU.drone.gain,.28],[AU.stat.g.gain,.12]].forEach(([p,k],j)=>p.setTargetAtTime(v[j]*k,tc,sil?.05:1.2))}

/* ---------- TIMELINE EVENTS ---------- */
const EV=[],MAP=t=>{const o=[0,22,46,70,92,114,136,158];let k=0;o.forEach((v,i)=>{if(t>=v)k=i});return S[k+1]+(t-o[k])*K[k+1]},
E=(t,f)=>EV.push({t:MAP(t),f}),ER=(t,f)=>EV.push({t,f}),L=(a,b,g,f)=>{for(let t=MAP(a);t<MAP(b);t+=g)EV.push({t,f})};
const strike=()=>{stalkN++;flash=1;strike2=.12+rnd()*.1;bolt=genBolt(150+rnd()*980);au('thunder',.35+rnd()*1.3)};
ER(7,()=>au('box'));ER(20,strike);ER(30,()=>au('whisper'));ER(41,strike);[54,55.4,56.6].forEach(t=>ER(t,()=>au('knock')));
[2.5,9,15,22.6,27,33,40,45.5,55,61,67].forEach(t=>E(t,strike));L(0,67,9,strike);
E(4.4,()=>au('caw',2));E(6,()=>au('creak',7));E(24.5,()=>au('caw',1));E(31,()=>{au('dig');au('rumble')});E(36.5,()=>au('whisper'));E(39,()=>au('whisper'));
[47.5,56,64].forEach(t=>E(t,()=>au('box')));[50,51.1,52].forEach(t=>E(t,()=>au('knock')));E(52.4,()=>au('creak',9));E(57,()=>au('whisper'));
[60.5,61.7,62.9,64.1,65.3,66.4].forEach(t=>E(t,()=>au('step')));L(62,70,.9,()=>au('heart'));E(67.4,()=>au('puff'));
for(let k=1;k<8;k++)E(70+k*3,()=>au('buzz'));E(79,()=>au('breath'));E(84,()=>au('scratch'));E(88,()=>au('whisper'));L(72,91,1.1,()=>au('heart'));
L(93,113,1.3,()=>au('drip'));E(100,()=>au('breath'));E(104,()=>au('whisper'));E(110,()=>au('riser'));E(112.8,()=>au('knock'));E(113.3,()=>{au('knock');au('glass')});
E(115,()=>au('box'));E(117,()=>au('creak',6));E(124,()=>au('giggle'));E(129,()=>au('giggle'));E(131,()=>au('whisper'));L(126,135,.8,()=>au('heart'));
L(137,150,4,()=>au('breath'));L(150,157,.3,()=>au('step'));E(152,()=>au('roar'));E(157.5,()=>au('zap'));
{let t=MAP(162),g=1.2;const te=MAP(180.6);while(t<te){ER(t,()=>au('heart'));t+=g;g=M.max(.45,g*.96)}}
E(166,()=>au('whisper'));E(172,()=>au('whisper'));E(176,()=>au('riser'));E(181,()=>au('scream'));
EV.sort((a,b)=>a.t-b.t);

/* ---------- LIGHTNING ---------- */
function genBolt(x0){const s=[];const br=(px,py,a,len,w,d)=>{const p=[[px,py]];for(let i=0;i<len/20;i++){a+=(rnd()-.5)*.8;px+=sin(a)*20;py+=cos(a)*20;p.push([px,py]);if(d<2&&rnd()<.1)br(px,py,a+(rnd()-.5)*1.6,len*.45,w*.55,d+1)}s.push({p,w})};br(x0,0,(rnd()-.5)*.3,460,3.5,0);return s}
function drawBolt(ox,oy,sc){if(!bolt||flash<.15)return;x.save();x.translate(ox,oy);x.scale(sc,sc);x.lineCap='round';x.lineJoin='round';
 bolt.forEach(b=>{x.beginPath();b.p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.strokeStyle=`rgba(215,228,255,${flash})`;x.lineWidth=b.w;x.shadowColor='#9bb8ff';x.shadowBlur=25;x.stroke()});x.restore()}

/* ---------- SHARED DRAWING ---------- */
const CL=[...Array(14)].map(()=>({x:rnd()*W*1.4,y:30+rnd()*260,r:140+rnd()*160,v:6+rnd()*10}));
function sky(){const f=flash*90,g=x.createLinearGradient(0,0,0,H*.75);g.addColorStop(0,`rgb(${6+f*.8},${8+f*.9},${16+f*1.2})`);g.addColorStop(1,`rgb(${20+f},${28+f*1.1},${40+f*1.3})`);x.fillStyle=g;x.fillRect(-100,-100,W+200,H+200);
 const mx=1000,my=140,rg=x.createRadialGradient(mx,my,10,mx,my,220);rg.addColorStop(0,'rgba(200,215,240,.35)');rg.addColorStop(1,'rgba(200,215,240,0)');x.fillStyle=rg;x.fillRect(mx-230,my-230,460,460);
 x.fillStyle='#cfd8e6';x.beginPath();x.arc(mx,my,46,0,PI*2);x.fill();x.fillStyle='rgba(120,135,160,.5)';[[-14,-8,10],[12,10,8],[-4,18,6]].forEach(c=>{x.beginPath();x.arc(mx+c[0],my+c[1],c[2],0,PI*2);x.fill()});
 CL.forEach(c=>{const cx=((c.x+T*c.v)%(W*1.4+400))-200,b=20+flash*140,g=x.createRadialGradient(cx,c.y,0,cx,c.y,c.r);g.addColorStop(0,`rgba(${b},${b+4},${b+14},.75)`);g.addColorStop(1,`rgba(${b},${b+4},${b+14},0)`);x.fillStyle=g;x.fillRect(cx-c.r,c.y-c.r,c.r*2,c.r*2)})}
const RN=[...Array(450)].map(()=>({x:rnd()*W*1.2,y:rnd()*H,v:900+rnd()*500,l:12+rnd()*18,a:.15+rnd()*.25}));
function rain(){x.lineWidth=1;RN.forEach(r=>{x.strokeStyle=`rgba(175,195,235,${r.a+flash*.3})`;x.beginPath();x.moveTo(r.x,r.y);x.lineTo(r.x+r.l*.18,r.y-r.l);x.stroke()})}
function fog(y,h,a){for(let i=0;i<7;i++){const cx=((i*260+T*(8+i*3))%(W+600))-300,cy=y+sin(T*.2+i)*20,b=60+flash*120;x.save();x.translate(0,cy);x.scale(1,.35);const g=x.createRadialGradient(cx,0,0,cx,0,h*2);g.addColorStop(0,`rgba(${b},${b+8},${b+20},${a})`);g.addColorStop(1,`rgba(${b},${b+8},${b+20},0)`);x.fillStyle=g;x.fillRect(cx-h*2,-h*2,h*4,h*4);x.restore()}}
function tree(px,py,s,sd,c){const r=seed(sd);x.strokeStyle=c;x.lineCap='round';const b=(bx,by,a,l,w,d)=>{const sw=sin(T*.9+bx*.01+d)*.035*(d+1),ex=bx+sin(a+sw)*l,ey=by-cos(a+sw)*l;x.lineWidth=w;x.beginPath();x.moveTo(bx,by);x.lineTo(ex,ey);x.stroke();if(d<6){const n=r()<.3?3:2;for(let i=0;i<n;i++)b(ex,ey,a+(r()-.5)*1.3+(i-.5)*.3,l*(.68+r()*.12),w*.68,d+1)}};b(px,py,0,95*s,14*s,0)}
function cap(t,sz,y,lt,a,b,col='200,200,210'){const al=sm((lt-a)/1.2)*(1-sm((lt-b)/1.2));if(al<=0)return;x.save();x.textAlign='center';x.font=`${sz}px Georgia`;x.letterSpacing='8px';x.fillStyle=`rgba(${col},${al*.85})`;x.shadowColor='#000';x.shadowBlur=12;x.fillText(t,W/2,y);x.restore()}
function ghost(px,py,s,al,t){x.save();x.translate(px,py);x.scale(s,s);x.globalAlpha*=al;const g=x.createLinearGradient(0,-170,0,150);g.addColorStop(0,'rgba(220,225,235,.95)');g.addColorStop(1,'rgba(220,225,235,0)');x.fillStyle=g;
 x.beginPath();x.moveTo(-26,-130);x.quadraticCurveTo(-60,0,-50+sin(t*2)*8,150);for(let i=0;i<=6;i++)x.lineTo(-50+i*16.6+sin(t*2.5+i)*8,150+(i%2?-18:10)+sin(t*3+i)*6);x.quadraticCurveTo(60,0,26,-130);x.closePath();x.fill();
 x.fillStyle='rgba(215,220,230,.95)';x.beginPath();x.ellipse(0,-150,24,30,0,0,PI*2);x.fill();
 x.strokeStyle='rgba(8,8,12,.95)';x.lineWidth=3;for(let i=-10;i<=10;i++){if(M.abs(i)<4)continue;x.beginPath();x.moveTo(i*2.2,-178);x.bezierCurveTo(i*5,-150,i*7+sin(t*2+i)*8,-60,i*8+sin(t*1.6+i)*14,-10+M.abs(i)*3);x.stroke()}
 x.fillStyle='#000';x.beginPath();x.ellipse(-9,-150,5,9,0,0,PI*2);x.ellipse(9,-150,5,9,0,0,PI*2);x.fill();x.restore()}
function face(cx,cy,s,t){x.save();x.translate(cx,cy);x.scale(s,s);x.rotate(sin(t*45)*.03);x.fillStyle='#000';x.beginPath();x.ellipse(0,20,330,430,0,0,PI*2);x.fill();
 x.fillStyle='#c9cdc4';x.beginPath();x.ellipse(0,0,190,250,0,0,PI*2);x.fill();x.fillStyle='#000';[-70,70].forEach(e=>{x.beginPath();x.ellipse(e,-40,46,72,0,0,PI*2);x.fill()});
 x.fillStyle='#fff';[-70,70].forEach(e=>{x.beginPath();x.arc(e+sin(t*60)*4,-30,6,0,PI*2);x.fill()});
 x.fillStyle='#000';x.beginPath();x.ellipse(0,130,68,115+sin(t*50)*10,0,0,PI*2);x.fill();x.fillStyle='#d8d8cc';for(let i=-4;i<=4;i++){x.beginPath();x.moveTo(i*14-6,40);x.lineTo(i*14+6,40);x.lineTo(i*14,70+(i%2)*10);x.fill()}
 x.strokeStyle='rgba(20,20,20,.6)';x.lineWidth=2;for(let i=0;i<6;i++){x.beginPath();x.moveTo(-150+i*60,-200);x.lineTo(-140+i*58+sin(i)*20,-90);x.stroke()}x.restore()}
function hand(px,py,r,t,rot,sc){x.save();x.translate(px,py);x.rotate(rot);x.scale(sc,sc);const L=r*170,sw=sin(t*2)*4*r;x.fillStyle='#8f9684';x.strokeStyle='#1b1f19';x.lineWidth=2;
 x.beginPath();x.moveTo(-13,0);x.quadraticCurveTo(-11+sw,-L/2,-14+sw,-L);x.lineTo(14+sw,-L);x.quadraticCurveTo(11+sw,-L/2,13,0);x.fill();x.stroke();
 x.beginPath();x.ellipse(sw,-L-10,19,16,0,0,PI*2);x.fill();x.stroke();x.lineCap='round';x.strokeStyle='#8f9684';
 for(let i=0;i<5;i++){const a=(i-2)*.33+sin(t*3+i*1.3)*.12*r,len=(i==0||i==4)?26:36,x0=sw+(i-2)*8,y0=-L-18,x1=x0+sin(a)*len*.6,y1=y0-cos(a)*len*.7,cr=sin(t*4+i)*.5*r;x.lineWidth=6;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.lineTo(x1+sin(a+1+cr)*len*.5,y1-cos(a+1+cr)*len*.4);x.stroke()}x.restore()}
function crow(px,py,s){const f=sin(T*16)*.8;x.fillStyle='#030406';x.beginPath();x.moveTo(px-8*s,py);x.quadraticCurveTo(px-24*s,py-22*s*f-6*s,px-44*s,py-8*s*f);x.quadraticCurveTo(px-22*s,py-4*s,px,py+4*s);x.quadraticCurveTo(px+22*s,py-4*s,px+44*s,py-8*s*f);x.quadraticCurveTo(px+24*s,py-22*s*f-6*s,px+8*s,py);x.fill()}
function stone(px,py,s,ty,al){x.save();x.globalAlpha*=al;x.translate(px,py);x.scale(s,s);x.fillStyle='rgba(0,0,0,.5)';x.beginPath();x.ellipse(0,0,50,9,0,0,PI*2);x.fill();const b=22+flash*150;
 x.fillStyle=`rgb(${b},${b+4},${b+10})`;x.strokeStyle=`rgb(${b*.5},${b*.5},${b*.55})`;x.lineWidth=3;x.beginPath();
 if(ty==0){x.moveTo(-32,0);x.lineTo(-32,-80);x.arc(0,-80,32,PI,0);x.lineTo(32,0)}else if(ty==1){x.rect(-9,-130,18,130);x.rect(-34,-100,68,16)}else{x.moveTo(-34,0);x.lineTo(-34,-70);x.lineTo(-12,-92);x.lineTo(4,-70);x.lineTo(30,-84);x.lineTo(34,0)}
 x.closePath();x.fill();x.stroke();x.fillStyle='rgba(40,70,40,.35)';x.fillRect(-30,-14,60,14);x.restore()}
const dk=document.createElement('canvas');dk.width=W;dk.height=H;const dx=dk.getContext('2d');

/* ---------- SCENE 1: THE GATE ---------- */
const GR=[...Array(140)].map(()=>({x:rnd()*W,h:30+rnd()*50,p:rnd()*6}));
function s1(lt){const z=1+lt*.012;x.save();x.translate(W/2+sin(T*.7)*2,H*.62);x.scale(z,z);x.translate(-W/2,-H*.62);
 sky();drawBolt(0,0,1);const f=flash,c=`rgb(${7+f*30},${10+f*34},${15+f*40})`;x.fillStyle=c;x.beginPath();x.moveTo(-100,H+200);for(let i=-100;i<=W+100;i+=20)x.lineTo(i,470+sin(i*.006)*40+sin(i*.017+1)*18);x.lineTo(W+100,H+200);x.fill();
 [[330,.8,3],[950,.9,5],[90,1.4,8],[1160,1.3,11]].forEach(t=>tree(t[0],t[0]<200||t[0]>1100?640:560,t[1],t[2],'#05070b'));
 fog(520,160,.1);
 const gy=585,gl=W/2-170,gr=W/2+170,op=sm((lt-6)/10)*.85;
 const pg=x.createLinearGradient(0,gy,0,430);pg.addColorStop(0,`rgba(120,135,160,${.14+f*.3})`);pg.addColorStop(1,'rgba(120,135,160,0)');x.fillStyle=pg;x.beginPath();x.moveTo(W/2-90,gy);x.lineTo(W/2+90,gy);x.lineTo(W/2+10,430);x.lineTo(W/2-10,430);x.fill();
 x.fillStyle='#04050a';for(let i=0;i<9;i++){x.fillRect(420+i*55,500-(i%3)*8,16+i%2*6,22+(i%3)*10)}
 x.fillStyle='#06080c';x.fillRect(gl-40,gy-250,40,250);x.fillRect(gr,gy-250,40,250);[gl-20,gr+20].forEach(px=>{x.beginPath();x.arc(px,gy-262,16,0,PI*2);x.fill()});
 [[gl,1],[gr,-1]].forEach(([hx,dir])=>{x.save();x.translate(hx,gy);x.scale(dir*(1-op*.9),1);for(let i=0;i<9;i++){x.fillRect(i*19,-230,5,230);x.beginPath();x.moveTo(i*19-2,-230);x.lineTo(i*19+2.5,-252);x.lineTo(i*19+7,-230);x.fill()}x.fillRect(0,-200,170,6);x.fillRect(0,-60,170,6);x.restore()});
 x.fillStyle='#020304';x.fillRect(-100,gy,W+200,H);stalker(W/2,gy+6,.7+M.min(stalkN,9)*.08);fog(600,120,.14);
 x.strokeStyle='#020304';x.lineWidth=3;GR.forEach(g=>{x.beginPath();x.moveTo(g.x,H+10);x.quadraticCurveTo(g.x,H-g.h/2,g.x+sin(T*1.5+g.p)*10+6,H-g.h);x.stroke()});
 rain();[[3,.9,200],[4.2,.8,260],[5,1,160]].forEach(([st,s,y],i)=>{const px=-80+(lt-st)*170;if(lt>st&&px<W+80)crow(px,y+sin(lt*2+i)*14,s)});
 x.restore();cap('MIDNIGHT',22,H*.42,lt,1.5,5);cap('ASHWOOD  CEMETERY',40,H*.5,lt,4,9,'190,40,40')}

/* ---------- SCENE 2: THE GRAVEYARD ---------- */
const ST=[...Array(70)].map(()=>({xo:rnd()*2-1,d0:rnd(),t:M.floor(rnd()*3)}));
function chapel(px,py){x.fillStyle=`rgb(${6+flash*25},${8+flash*28},${13+flash*34})`;x.fillRect(px-70,py-80,140,80);x.beginPath();x.moveTo(px-80,py-80);x.lineTo(px,py-150);x.lineTo(px+80,py-80);x.fill();x.fillRect(px+40,py-190,36,110);x.beginPath();x.moveTo(px+34,py-190);x.lineTo(px+58,py-250);x.lineTo(px+82,py-190);x.fill();const f=.5+.5*sin(T*9)*sin(T*3.1);x.fillStyle=`rgba(255,170,70,${.25+.35*f})`;x.fillRect(px-45,py-60,16,30);x.fillRect(px+10,py-60,16,30)}
function s2(lt){const hy=360;x.save();x.translate(sin(T*.5)*6,sin(T*.9)*3);sky();drawBolt(0,0,1);
 x.fillStyle=`rgb(${6+flash*28},${9+flash*30},${14+flash*36})`;x.beginPath();x.moveTo(-50,hy+10);for(let i=-50;i<=W+50;i+=20)x.lineTo(i,hy-30+sin(i*.005)*30+sin(i*.02)*8);x.lineTo(W+50,hy+20);x.fill();
 chapel(250,hy);const gg=x.createLinearGradient(0,hy,0,H);gg.addColorStop(0,'#0a100e');gg.addColorStop(1,'#020303');x.fillStyle=gg;x.fillRect(-50,hy,W+100,H);fog(hy+10,170,.13);
 ST.map(s=>({...s,d:(s.d0+T*.012)%1})).sort((a,b)=>a.d-b.d).forEach(s=>{const d=s.d,al=sm(d/.15)*(1-sm((d-.9)/.1));stone(W/2+s.xo*(.25+d*1.4)*620,hy+M.pow(d,1.7)*340,.15+d*1.25,s.t,al)});
 const hx=W/2+120,hyy=600,r=sm((lt-9)/7);
 if(r>0){hand(hx,hyy,r,T,.15,1);if(lt<14)for(let i=0;i<12;i++){const tt=(lt*1.3+i*.37)%1;x.fillStyle='#120d09';x.fillRect(hx+(i-6)*9,hyy-30-tt*(1-tt)*240,4,4)}}
 x.fillStyle='#0c0805';x.beginPath();x.ellipse(hx,hyy+2,56,15,0,0,PI*2);x.fill();
 const ga=sm((lt-14)/2)*(.6+.4*sin(T*5)*sin(T*1.7));if(ga>0)ghost(W*.3+(lt-14)*18,hy+70,.55,.55*ga,T);
 stalker(W*.62,480,.5+M.min(stalkN,12)*.1);tree(110,690,2.2,21,'#030406');tree(1190,700,2.1,34,'#030406');
 if(lt>8&&sin(T*.8)>-.95){[[1135,470],[1160,468]].forEach(([ex,ey])=>{const g=x.createRadialGradient(ex,ey,0,ex,ey,16);g.addColorStop(0,'rgba(255,60,30,1)');g.addColorStop(1,'rgba(255,60,30,0)');x.fillStyle=g;x.fillRect(ex-16,ey-16,32,32)})}
 fog(650,200,.22);rain();x.restore();cap('THEY  NEVER  REST',34,H*.18,lt,2,7,'170,30,30')}

/* ---------- SCENE 3: THE ROOM ---------- */
function chair(px,py,a){x.save();x.translate(px,py);x.rotate(a);x.strokeStyle='#3a2418';x.lineWidth=7;x.lineCap='round';x.beginPath();x.arc(0,-150,150,PI*.3,PI*.7);x.stroke();
 x.lineWidth=6;[[-60,-18,-52,-100],[60,-18,52,-100],[-55,-104,-62,-250],[55,-104,62,-250],[-58,-150,-88,-150],[58,-150,88,-150]].forEach(l=>{x.beginPath();x.moveTo(l[0],l[1]);x.lineTo(l[2],l[3]);x.stroke()});
 x.lineWidth=4;for(let i=0;i<5;i++){x.beginPath();x.moveTo(-58,-140-i*24);x.lineTo(58,-140-i*24);x.stroke()}x.fillStyle='#160c08';x.fillRect(-72,-106,144,14);x.fillRect(-70,-262,140,12);x.restore()}
function s3(lt){x.save();x.translate(sin(T*.6)*3,cos(T*.5)*2);
 x.fillStyle='#2a1a17';x.fillRect(-20,-20,W+40,560);for(let i=0;i<W;i+=48){x.fillStyle=i%96?'rgba(0,0,0,.18)':'rgba(120,40,30,.1)';x.fillRect(i,0,24,520)}
 const fg=x.createLinearGradient(0,520,0,H);fg.addColorStop(0,'#1a0f0c');fg.addColorStop(1,'#080504');x.fillStyle=fg;x.fillRect(-20,520,W+40,H);x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=2;for(let i=-10;i<=20;i++){x.beginPath();x.moveTo(W/2+i*30,520);x.lineTo(W/2+i*150,H);x.stroke()}
 x.fillStyle='#120a08';x.fillRect(-20,505,W+40,18);
 x.save();x.beginPath();x.rect(140,100,200,260);x.clip();const f=flash*100,wg=x.createLinearGradient(0,100,0,360);wg.addColorStop(0,`rgb(${8+f},${12+f},${24+f*1.3})`);wg.addColorStop(1,`rgb(${20+f},${26+f},${40+f*1.3})`);x.fillStyle=wg;x.fillRect(140,100,200,260);drawBolt(200,100,.55);rain();x.restore();
 x.strokeStyle='#1a100c';x.lineWidth=10;x.strokeRect(140,100,200,260);x.lineWidth=6;x.beginPath();x.moveTo(240,100);x.lineTo(240,360);x.moveTo(140,230);x.lineTo(340,230);x.stroke();
 const cs=sin(T*.8)*10;x.fillStyle='#2a0a0c';[[100,190,1],[380,290,-1]].forEach(([cx,ex,d])=>{x.beginPath();x.moveTo(cx,90);x.lineTo(cx+d*100,90);x.quadraticCurveTo(cx+d*100+cs*d,250,ex+d*5+cs,500);x.lineTo(cx-d*20,500);x.quadraticCurveTo(cx-d*20+cs,250,cx,90);x.fill()});
 const wp=sm((lt-10)/4);if(wp>0){x.save();x.beginPath();x.rect(400,60,wp*380,160);x.clip();x.font='italic bold 58px Georgia';x.fillStyle='#7a0a0a';x.shadowColor='#400';x.shadowBlur=6;x.fillText('GET OUT',410,130);x.shadowBlur=0;[420,470,530,590,650].forEach((dxx,i)=>x.fillRect(dxx,125,3,10+wp*(30+i*17)*(1+sin(i)*.3)));x.restore()}
 const op=sm((lt-6)/10),gw=op*150;x.fillStyle='#0d1218';x.fillRect(880,140,gw+10,380);x.fillStyle='#120b08';x.fillRect(868,130,14,396);x.fillRect(1030,130,14,396);x.fillRect(868,128,176,14);
 const fp=sm((lt-13)/9);if(lt>13){x.save();const sc=lp(.7,1.5,fp),fx=950+sin(T*7)*(1-fp)*3;x.translate(fx,520);x.scale(sc,sc);x.fillStyle='#000';x.beginPath();x.ellipse(0,-165,20,26,0,0,PI*2);x.fill();x.fillRect(-26,-145,52,110);x.fillRect(-18,-40,14,40);x.fillRect(4,-40,14,40);
  x.lineWidth=9;x.strokeStyle='#000';x.lineCap='round';x.beginPath();x.moveTo(-26,-140);x.lineTo(-34+sin(T*2)*3,-60);x.moveTo(26,-140);x.lineTo(34+sin(T*2.3)*3,-60);x.stroke();x.restore()}
 x.fillStyle='#160c08';x.beginPath();x.moveTo(1040,140);x.lineTo(1040-170*(1-op*.75),140+op*20);x.lineTo(1040-170*(1-op*.75),520-op*20);x.lineTo(1040,520);x.fill();x.strokeStyle='#241610';x.lineWidth=3;x.stroke();
 chair(520,545,sin(T*1.3)*.07);x.fillStyle='#1c120d';x.fillRect(650,430,100,10);x.fillRect(660,440,8,100);x.fillRect(732,440,8,100);x.fillStyle='#d9cfae';x.fillRect(695,395,12,35);
 {const px=1130,py=240;x.fillStyle='#3a2a12';x.beginPath();x.ellipse(px,py,62,82,0,0,PI*2);x.fill();x.fillStyle='#0f0d0b';x.beginPath();x.ellipse(px,py,52,72,0,0,PI*2);x.fill();x.fillStyle='#b8aa94';x.beginPath();x.ellipse(px,py+4,28,40,0,0,PI*2);x.fill();
  const k=sm((lt-9)/3),bl=sin(T*.9)>.97?.2:1;[-11,11].forEach(e=>{x.fillStyle='#e8e0d0';x.beginPath();x.ellipse(px+e,py-8,7,7*bl,0,0,PI*2);x.fill();x.fillStyle='#000';x.beginPath();x.arc(px+e+lp(sin(T*.6)*3,0,k),py-8,lp(2.5,4.5,k),0,PI*2);x.fill()});x.fillStyle='#2a1010';x.fillRect(px-9,py+20,18,2)}
 const on=1-sm((lt-21.4)/.5);dx.globalCompositeOperation='source-over';dx.clearRect(0,0,W,H);dx.fillStyle=`rgba(2,1,3,${.93-flash*.45})`;dx.fillRect(0,0,W,H);dx.globalCompositeOperation='destination-out';
 const fr=(300+sin(T*17)*14+sin(T*7.3)*20+(rnd()-.5)*10)*on;if(on>0){let g=dx.createRadialGradient(701,395,0,701,395,fr);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.5,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');dx.fillStyle=g;dx.fillRect(0,0,W,H)}
 let g2=dx.createRadialGradient(240,230,0,240,230,260);g2.addColorStop(0,'rgba(0,0,0,.25)');g2.addColorStop(1,'rgba(0,0,0,0)');dx.fillStyle=g2;dx.fillRect(0,0,W,H);x.drawImage(dk,-20,-20,W+40,H+40);
 if(on>0){const fl2=sin(T*21)*2+sin(T*13)*1.5,g=x.createRadialGradient(701,388,0,701,388,45);g.addColorStop(0,`rgba(255,190,80,${.5*on})`);g.addColorStop(1,'rgba(255,120,30,0)');x.fillStyle=g;x.fillRect(650,340,100,100);x.fillStyle='#ffb43a';x.beginPath();x.ellipse(701+fl2*.6,386,4*on,(11+fl2*.5)*on,0,0,PI*2);x.fill();x.fillStyle='#fff3c0';x.beginPath();x.ellipse(701,389,1.8*on,5*on,0,0,PI*2);x.fill()}
 if(lt>15){const sc=lp(.7,1.5,fp),ey=520-165*sc,bl=sin(T*.7)>.96?.2:1,a=sm((lt-15)/2);x.save();x.shadowColor='#fff';x.shadowBlur=14;x.fillStyle=`rgba(255,255,255,${a})`;[-8,8].forEach(e=>{x.beginPath();x.ellipse(950+e*sc,ey,3*sc,5*sc*bl,0,0,PI*2);x.fill()});x.restore()}
 x.restore()}

/* ---------- SCENE 4: THE TV ---------- */
function sFinal(lt){x.fillStyle='#040405';x.fillRect(0,0,W,H);
 if(lt>=24.4){const ta=sm((lt-26)/2.5);x.save();x.textAlign='center';x.font='bold 74px Georgia';x.letterSpacing='14px';x.fillStyle=`rgba(150,12,12,${ta*(.8+.2*sin(T*30)*rnd())})`;x.shadowColor='#f00';x.shadowBlur=24;x.fillText('THE HOLLOW NIGHT',W/2,H/2);
  x.font='18px Georgia';x.letterSpacing='6px';x.shadowBlur=0;x.fillStyle=`rgba(120,120,120,${sm((lt-29)/2)})`;x.fillText('PRESS  R  TO  WATCH  AGAIN',W/2,H/2+60);x.restore();return}
 x.fillStyle='#0b0a0d';for(let i=0;i<W;i+=60)x.fillRect(i,0,30,520);x.fillStyle='#070608';x.fillRect(0,520,W,200);
 x.globalCompositeOperation='lighter';const gl=(.2+rnd()*.1)*(lt>12?.6+.4*sin(T*40):1),g=x.createRadialGradient(W/2,340,0,W/2,340,560);g.addColorStop(0,`rgba(70,100,140,${gl})`);g.addColorStop(1,'rgba(70,100,140,0)');x.fillStyle=g;x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over';
 x.fillStyle='#14100d';x.fillRect(430,190,420,310);x.fillStyle='#0c0a08';x.fillRect(440,500,20,70);x.fillRect(820,500,20,70);x.fillRect(420,500,440,12);
 x.fillStyle='#050505';[[790,260],[790,330]].forEach(([kx,ky])=>{x.beginPath();x.arc(kx,ky,20,0,PI*2);x.fill()});
 x.save();x.beginPath();x.roundRect(455,215,290,260,22);x.clip();
 if(sin(T*3.3)>.93&&lt<6){x.fillStyle='#000';x.fillRect(455,215,290,260)}else{x.globalAlpha=.9;x.drawImage(nz[(T*30|0)%4],455,215,290,260);x.globalAlpha=1}
 const ga=sm((lt-6)/5)*.75;if(ga>0)ghost(W/2-5,440,lerp2(.5,1,sm((lt-12)/6)),ga*(.7+.3*rnd()),T);
 x.fillStyle='rgba(255,255,255,.1)';x.fillRect(455,215+((T*90)%330)-40,290,70);x.fillStyle='rgba(0,0,0,.28)';for(let y=215;y<475;y+=4)x.fillRect(455,y,290,2);x.restore();
 x.strokeStyle='#050505';x.lineWidth=8;x.beginPath();x.roundRect(455,215,290,260,22);x.stroke();
 if(lt>15){const ha=sm((lt-15)/3);hand(W/2-60,470,ha*1.3,T,-.5,1.3);hand(W/2+60,470,ha*1.3,T,.5,1.3)}
 if(lt>=18){const p=sm((lt-18)/4.8),tq=M.floor(T*9)/9;ghost(W/2+sin(tq*40)*6*p,lp(450,900,p),lp(1,3.4,p),1,tq)}
 if(lt>=23){const jp=sm((lt-23)/.22);x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,W,H);face(W/2,H*.5,lp(.4,2.2,jp),T);if(lt<23.15){x.fillStyle=`rgba(255,255,255,${(1-(lt-23)/.15)*.9})`;x.fillRect(0,0,W,H)}}}
const lerp2=lp;

/* ---------- STALKER + GLITCH FX ---------- */
function stalker(px,py,s){if(flash<.2)return;x.save();x.globalAlpha=M.min(1,flash*1.4);x.translate(px,py);x.scale(s,s);x.fillStyle='#000';x.strokeStyle='#000';x.lineCap='round';x.beginPath();x.ellipse(0,-205,17,24,0,0,PI*2);x.fill();x.fillRect(-14,-185,28,100);x.lineWidth=7;x.beginPath();x.moveTo(-12,-180);x.lineTo(-30,-60);x.moveTo(12,-180);x.lineTo(30,-60);x.moveTo(-8,-85);x.lineTo(-12,0);x.moveTo(8,-85);x.lineTo(12,0);x.stroke();x.fillStyle='#fff';x.fillRect(-9,-208,6,4);x.fillRect(4,-208,6,4);x.restore()}
let sub=0;
function fx(){const i=S.reduce((a,s,k)=>T>=s?k:a,0);
 if(flash>.6||rnd()<.004+i*.0015)for(let k=0;k<3;k++){const y=rnd()*H,h=6+rnd()*30;x.drawImage(cv,0,y,W,h,(rnd()-.5)*50,y,W,h)}
 if(i>=2&&i<8&&sub<=0&&rnd()<.0003*i){sub=3;au('zap')}
 if(sub>0){sub--;x.fillStyle='#000';x.fillRect(0,0,W,H);face(W/2,H/2,.9+rnd()*.2,T);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H)}
 if(i>=4&&rnd()<.02){x.globalCompositeOperation='lighter';x.fillStyle='rgba(120,0,0,.07)';x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over'}}

/* ---------- SCENE 4: THE HALLWAY ---------- */
function sHall(lt){x.fillStyle='#030504';x.fillRect(0,0,W,H);const vx=W/2,vy=330,st=M.floor(lt/3),ph=lt%3;
 const off=(ph<.35&&lt>2.5)||(rnd()<.03&&lt>6)||sin(T*13)>.97,on=!off;
 x.fillStyle=on?'#1a211d':'#050706';x.beginPath();x.moveTo(0,0);x.lineTo(vx-90,vy-30);x.lineTo(vx-90,vy+50);x.lineTo(0,H);x.fill();x.beginPath();x.moveTo(W,0);x.lineTo(vx+90,vy-30);x.lineTo(vx+90,vy+50);x.lineTo(W,H);x.fill();
 x.fillStyle=on?'#121714':'#040505';x.beginPath();x.moveTo(0,0);x.lineTo(W,0);x.lineTo(vx+90,vy-30);x.lineTo(vx-90,vy-30);x.fill();
 x.fillStyle=on?'#0f1311':'#030404';x.beginPath();x.moveTo(0,H);x.lineTo(W,H);x.lineTo(vx+90,vy+50);x.lineTo(vx-90,vy+50);x.fill();x.fillStyle='#000';x.fillRect(vx-90,vy-30,180,80);
 [.14,.42,.66,.82].forEach((f,k)=>[-1,1].forEach(sd=>{const xa=lp(0,vx-90,f),xb=lp(0,vx-90,f+.09),ta=lp(0,vy-30,f),ba=lp(H,vy+50,f),tb=lp(0,vy-30,f+.09),bb=lp(H,vy+50,f+.09),X=v=>sd<0?v:W-v;
  x.fillStyle=(sd>0&&k==2&&lt>9)?'#000':on?'#2a1c14':'#080504';x.beginPath();x.moveTo(X(xa),ta+(ba-ta)*.22);x.lineTo(X(xb),tb+(bb-tb)*.22);x.lineTo(X(xb),bb);x.lineTo(X(xa),ba);x.fill()}));
 [.18,.48,.72].forEach(f=>{const ly=lp(0,vy-30,f),r=lp(90,10,f);if(on){const g=x.createRadialGradient(vx,ly,0,vx,ly,r*4);g.addColorStop(0,'rgba(210,235,200,.3)');g.addColorStop(1,'rgba(210,235,200,0)');x.fillStyle=g;x.fillRect(vx-r*4,ly-r*4,r*8,r*8)}x.fillStyle=on?'#dfe8d0':'#111';x.fillRect(vx-r/2,ly,r,r*.25)});
 const stage=lt<24?st:7,sf=lt>21.5?lp(.69,1.6,sm((lt-21.5)/1.5)):.06+stage*.09+ph*.01,fx_=vx+(stage%2?6:-6),fy=vy+10+sf*70;
 if(lt>2){if(on)ghost(fx_,fy,sf,1,T);else{x.fillStyle='#fff';[-9,9].forEach(e=>{x.beginPath();x.arc(fx_+e*sf,fy-150*sf,M.max(1.5,3*sf),0,PI*2);x.fill()})}}
 if(lt>10&&sin(T*.9)>-.9){[886,898].forEach(ex=>{x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=10;x.beginPath();x.arc(ex,340,3,0,PI*2);x.fill()});x.shadowBlur=0}}

/* ---------- SCENE 5: THE MIRROR ---------- */
function sMirror(lt){x.fillStyle='#0b100f';x.fillRect(0,0,W,H);for(let i=0;i<W;i+=64)for(let j=0;j<520;j+=64){x.fillStyle=(i/64+j/64)%2?'#101716':'#0d1312';x.fillRect(i,j,64,64)}
 x.fillStyle='#050808';x.fillRect(0,520,W,200);x.fillStyle='#b9c0bc';x.fillRect(520,470,240,60);x.fillRect(636,440,8,32);x.fillStyle='#d8e4ee';const dy=(T%1.3)*50;x.beginPath();x.arc(640,478+dy*.2,3,0,PI*2);x.fill();
 const dark=lt>10&&sin(T*30)>.9;x.fillStyle='#1a1410';x.fillRect(436,76,408,358);x.save();x.beginPath();x.rect(445,85,390,340);x.clip();
 const g=x.createLinearGradient(0,85,0,425);g.addColorStop(0,'#1a2422');g.addColorStop(1,'#0a0f0e');x.fillStyle=g;x.fillRect(445,85,390,340);
 const turn=sm((lt-8)/2),px=W/2+sin(T*.7)*(1-turn)*6;x.fillStyle='#050606';x.beginPath();x.ellipse(px,270,46,58,0,0,PI*2);x.fill();x.beginPath();x.moveTo(px-130,425);x.quadraticCurveTo(px-120,340,px-40,330);x.lineTo(px+40,330);x.quadraticCurveTo(px+120,340,px+130,425);x.fill();
 const gr=sm((lt-11)/2);if(gr>0){x.strokeStyle=`rgba(240,240,230,${gr})`;x.lineWidth=5;x.lineCap='round';x.beginPath();x.arc(px,278,26,.15,PI-.15);x.stroke();x.fillStyle=`rgba(255,255,255,${gr})`;[-16,16].forEach(e=>{x.beginPath();x.ellipse(px+e,258,5,8,0,0,PI*2);x.fill()})}
 x.fillStyle=`rgba(200,215,210,${.28-sm((lt-10)/2)*.1})`;x.fillRect(445,85,390,340);
 const wp=sm((lt-10)/4);if(wp>0){x.save();x.beginPath();x.rect(445,85,wp*390,340);x.clip();x.font='italic bold 46px Georgia';x.fillStyle='#8a0e0e';x.textAlign='center';x.fillText('BEHIND YOU',W/2,190);for(let i=0;i<8;i++)x.fillRect(W/2-150+i*38,195,3,8+wp*(20+i*9));x.restore()}
 const ga=sm((lt-14)/3);if(ga>0)ghost(W/2+80,330,lp(.45,.62,ga),ga*.8,T);
 if(lt>19)face(W/2,255,lp(.15,.9,sm((lt-19)/2.5)),T);
 if(lt>21.3){x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=1.5;const r=seed(5);for(let i=0;i<14;i++){let a=r()*PI*2,qx=W/2,qy=255;x.beginPath();x.moveTo(qx,qy);for(let k=0;k<6;k++){a+=(r()-.5)*.8;qx+=cos(a)*35;qy+=sin(a)*35;x.lineTo(qx,qy)}x.stroke()}}
 x.restore();x.fillStyle=`rgba(0,0,0,${dark?.75:.32})`;x.fillRect(0,0,W,H)}

/* ---------- SCENE 6: THE BEDROOM ---------- */
function sBed(lt){x.fillStyle='#07080d';x.fillRect(0,0,W,H);x.fillStyle='#0c0e16';for(let i=0;i<W;i+=70)for(let j=0;j<500;j+=70){x.beginPath();x.arc(i+((j/70)%2)*35,j+20,3,0,PI*2);x.fill()}
 x.fillStyle='#0d1424';x.fillRect(110,90,200,250);x.strokeStyle='#05070c';x.lineWidth=8;x.strokeRect(110,90,200,250);x.beginPath();x.moveTo(210,90);x.lineTo(210,340);x.stroke();x.fillStyle='#050509';x.fillRect(0,520,W,200);
 const op=sm((lt-3)/7),ap=sm((lt-14)/8);x.fillStyle='#000';x.fillRect(850,130,240,390);x.fillStyle='#1a1412';x.fillRect(850,130,240*(1-op*.85),390);x.strokeStyle='#0a0807';x.strokeRect(850,130,240*(1-op*.85),390);
 if(lt>7){const a=sm((lt-7)/3),cx=lp(1020,W/2,ap),cy=lp(250,340,ap),sp=lp(18,170,M.pow(ap,1.5)),er=lp(5,26,ap);x.save();x.shadowColor='#fff';x.shadowBlur=14;x.fillStyle=`rgba(255,255,255,${a})`;[-1,1].forEach(e=>{x.beginPath();x.ellipse(cx+e*sp,cy,er,er*1.4,0,0,PI*2);x.fill()});
  x.strokeStyle=`rgba(240,240,230,${a})`;x.lineWidth=lp(3,10,ap);x.lineCap='round';x.beginPath();x.arc(cx,cy+lp(12,40,ap),lp(26,230,ap),.2,PI-.2);x.stroke();x.restore()}
 const nl=(1-sm((lt-16)/3))*(.7+.3*sin(T*7)*sin(T*2.3)),g=x.createRadialGradient(700,500,0,700,500,320);g.addColorStop(0,`rgba(255,200,120,${.45*nl})`);g.addColorStop(1,'rgba(255,160,60,0)');x.fillStyle=g;x.fillRect(300,200,800,520);
 const by=lp(430,720,sm((lt-18)/2.5)),hr=cl(sm((lt-11)/4)*(H-by+40)/204,0,1.6);if(hr>0)hand(260,H+20,hr,T,0,1.2);
 x.fillStyle='#1a1630';x.beginPath();x.moveTo(-10,H+10);x.lineTo(-10,by);for(let i=0;i<=W+10;i+=40)x.lineTo(i,by+sin(i*.02)*10+(i>180&&i<340&&lt>17?-(1-M.abs(i-260)/80)*30:0));x.lineTo(W+10,H+10);x.fill();
 x.fillStyle=`rgba(0,0,0,${.35+(1-nl)*.35+(lt>20?sm((lt-20)/1.5)*.3:0)})`;x.fillRect(0,0,W,H)}

/* ---------- SCENE 7: FOUND FOOTAGE ---------- */
function sFoot(lt){const q=lt>20?sm((lt-20)/1.5):0,j=6*(1+q*4);x.save();x.translate(W/2,H/2);x.rotate(q*.6+sin(T*9)*.004);x.translate(-W/2+(rnd()-.5)*j,-H/2+(rnd()-.5)*j);
 const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0a2412');bg.addColorStop(1,'#031008');x.fillStyle=bg;x.fillRect(-100,-100,W+200,H+200);
 const pan=sin(T*.4)*60;for(let i=0;i<7;i++)tree(100+i*190+pan*(.4+i%3*.3),600+(i%2)*40,1.1+(i%3)*.4,40+i,'#010802');x.fillStyle='#02090a';x.fillRect(-100,600,W+200,200);
 const lx=W/2+sin(T*.5)*120,g=x.createRadialGradient(W/2,H+40,10,lx,330,520);g.addColorStop(0,'rgba(150,255,170,.45)');g.addColorStop(1,'rgba(150,255,170,0)');x.fillStyle=g;x.beginPath();x.moveTo(W/2-40,H);x.lineTo(lx-220,200);x.lineTo(lx+220,200);x.lineTo(W/2+40,H);x.fill();
 const tq=M.floor(T*10)/10;if(lt>6&&lt<12&&rnd()<.8)ghost(W*.64,420,.4,.8,tq);if(lt>16){const p=sm((lt-16)/5);ghost(lp(W*.64,W/2,p)+sin(tq*50)*8*p,lp(420,700,p),lp(.4,3.2,p),1,tq)}
 x.restore();x.globalCompositeOperation='multiply';x.fillStyle='#50ff70';x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over';
 x.save();x.globalAlpha=.2;x.fillStyle=pat[(T*24|0)%4];x.fillRect(0,0,W,H);x.restore();x.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<H;y+=4)x.fillRect(0,y,W,1);
 x.font='26px monospace';x.textAlign='left';x.fillStyle='#bfffc8';if(sin(T*3)>0){x.fillStyle='#f33';x.beginPath();x.arc(80,80,9,0,PI*2);x.fill();x.fillStyle='#bfffc8'}x.fillText('REC',100,89);x.fillText('03:17:'+String(17+M.floor(lt)).padStart(2,'0'),W-210,89);x.fillText('CAM 02  BAT ▮▮▯',80,H-70);
 if(lt>=21.6){x.drawImage(nz[(T*30|0)%4],0,0,W,H);x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.textAlign='center';x.font='bold 40px monospace';x.fillText('SIGNAL LOST',W/2,H/2)}
 if(lt>=23.5){x.fillStyle='#000';x.fillRect(0,0,W,H)}}

/* ---------- STORY: PROLOGUE LETTER + NARRATION ---------- */
const LET=["Elena,","If you are reading this, I am already gone.","Do not sleep in this house after midnight.","Do not answer when she knocks. Do not say her name.","The ground at Ashwood is never quiet. Do not run.","She only moves when you are not looking.","- Grandma Ruth"];
function sLetter(lt){x.fillStyle='#0a0705';x.fillRect(0,0,W,H);
 x.save();x.beginPath();x.rect(80,70,260,260);x.clip();const f=flash*100,g=x.createLinearGradient(0,70,0,330);g.addColorStop(0,`rgb(${8+f},${12+f},${24+f*1.3})`);g.addColorStop(1,`rgb(${22+f},${28+f},${42+f*1.3})`);x.fillStyle=g;x.fillRect(80,70,260,260);drawBolt(140,70,.5);rain();x.restore();
 x.strokeStyle='#1a100c';x.lineWidth=10;x.strokeRect(80,70,260,260);x.beginPath();x.moveTo(210,70);x.lineTo(210,330);x.stroke();
 x.fillStyle='#150d08';x.fillRect(0,380,W,340);x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=2;for(let i=0;i<9;i++){x.beginPath();x.moveTo(0,400+i*38);x.lineTo(W,400+i*38);x.stroke()}
 x.save();x.translate(W/2+20,330);x.rotate(-.03);x.fillStyle='#cfc4a6';x.fillRect(-320,-190,640,420);x.fillStyle='rgba(90,60,30,.12)';for(let i=0;i<6;i++)x.fillRect(-320,-190+i*70,640,30);
 x.font='24px "Segoe Script","Bradley Hand","Brush Script MT",cursive';x.fillStyle='#2a1a10';x.textAlign='left';[4,12,20,30,38,47,54].forEach((t,j)=>{const n=M.floor((lt-t)*14);if(n>0)x.fillText(LET[j].slice(0,n),-295,-130+j*52)});x.restore();
 x.fillStyle='#d9cfae';x.fillRect(1094,430,12,60);x.fillStyle='#2a1a10';x.fillRect(1070,490,60,8);
 dx.globalCompositeOperation='source-over';dx.clearRect(0,0,W,H);dx.fillStyle=`rgba(2,1,3,${.9-flash*.45})`;dx.fillRect(0,0,W,H);dx.globalCompositeOperation='destination-out';
 const fr=360+sin(T*17)*14+sin(T*7.3)*20+(rnd()-.5)*10;[[1100,430,fr,1],[660,340,430,.85]].forEach(([cx,cy,r,a])=>{const g2=dx.createRadialGradient(cx,cy,0,cx,cy,r);g2.addColorStop(0,`rgba(0,0,0,${a})`);g2.addColorStop(.55,`rgba(0,0,0,${a*.6})`);g2.addColorStop(1,'rgba(0,0,0,0)');dx.fillStyle=g2;dx.fillRect(0,0,W,H)});
 x.drawImage(dk,0,0);const fl2=sin(T*21)*2+sin(T*13)*1.5,gg=x.createRadialGradient(1100,420,0,1100,420,50);gg.addColorStop(0,'rgba(255,190,80,.5)');gg.addColorStop(1,'rgba(255,120,30,0)');x.fillStyle=gg;x.fillRect(1040,360,120,120);
 x.fillStyle='#ffb43a';x.beginPath();x.ellipse(1100+fl2*.6,418,4.5,12+fl2*.5,0,0,PI*2);x.fill();x.fillStyle='#fff3c0';x.beginPath();x.ellipse(1100,421,2,5,0,0,PI*2);x.fill()}
let cur=null;
function say(tx){cur={t:tx,t0:T,d:M.max(4,tx.length/12)};if(!mute&&window.speechSynthesis){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(tx);u.rate=.82;u.pitch=.8;const vs=speechSynthesis.getVoices(),v=vs.find(v=>/^en/i.test(v.lang)&&/female|zira|samantha|aria|uk english/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}}
const NL=[[0,3,"My name is Elena Voss. Three nights ago, my grandmother died."],[0,14,"The police said she was found in Ashwood Cemetery. Kneeling. Her eyes were open."],[0,28,"She left me this letter... and a house I never wanted to enter."],[0,42,"I should have burned it. I should have driven home."],
[1,4,"The caretaker locks the gates at dusk. Tonight, they were already open."],[1,16,"The road to her house cuts through the cemetery. Four minutes, she wrote. Never stop walking."],[1,32,"Behind me, the storm began. And somewhere, a crow started to scream."],[1,48,"I told myself the shape between the pillars was a statue."],
[2,5,"Every grave here had a name. Hers was still fresh. No stone yet. Just earth."],[2,22,"Then the ground... breathed."],[2,34,"A hand. Pale. Reaching up as if it were waving goodbye."],[2,50,"Grandma's letter said: if the ground moves, do not run. It wants you to run."],[2,66,"So I walked. And in every flash of lightning, someone stood a little closer."],
[3,3,"The house smelled of candle wax and cold earth. Every clock had stopped at midnight."],[3,15,"Three knocks. From inside the walls."],[3,34,"The portrait on the wall... its eyes were following me."],[3,50,"Someone had written on the wall. Not in paint."],[3,64,"And in the doorway, where there had been only darkness... a tall man stood. Waiting."],
[4,5,"The hallway lights began to fail. Each time they returned..."],[4,18,"...the girl was closer."],[4,30,"Grandma wrote that she only moves when nobody is looking. So I stopped blinking."],[4,48,"But the eyes... you can never keep them open forever."],[4,64,"Her name was Mara. I knew it, though no one had ever told me."],
[5,5,"I washed my face, hands shaking. The mirror fogged, though the water was cold."],[5,22,"My reflection stopped when I moved. Then it smiled. I was not smiling."],[5,40,"Something wrote a warning in the steam. I read it too late."],[5,56,"Behind my reflection, behind my shoulder... Mara."],
[6,5,"At the end of the hall, a child's room. Dust-free. As if someone still slept there."],[6,22,"I found a diary. 1962. The village had locked a mute girl in a closet during a fever."],[6,38,"Mara died in there, scratching at the door. My grandmother was ten. She held the key."],[6,54,"The dead do not forgive the one who stood outside the door."],[6,68,"The closet was slowly... opening."],
[7,4,"I ran into the woods behind the house, my phone still recording."],[7,18,"The police found it later. This is what it saw."],[7,34,"Something was out there. Standing still. When I looked away, it moved."],[7,50,"Mara was never trying to scare me. She wanted me to know how it felt."],
[8,5,"Home. Safe. I thought. The old television turned itself on."],[8,22,"Static... and in it, a small silhouette. Waiting for someone to let her out."],[8,40,"She does not knock. She crawls."],[8,56,"The last thing I remember... is how cold her hands were."],[8,69.5,"They never found Elena Voss."],[8,74,"The house at Ashwood still keeps a light on at night."]];
NL.forEach(([i,o,tx])=>ER(S[i]+o,()=>say(tx)));EV.sort((a,b)=>a.t-b.t);

/* ---------- POST / RENDER ---------- */
function post(){if(flash>0){x.fillStyle=`rgba(200,215,255,${flash*.18})`;x.fillRect(0,0,W,H)}
 x.save();x.globalAlpha=.07;x.fillStyle=pat[(T*24|0)%4];x.translate(rnd()*256,rnd()*256);x.fillRect(-256,-256,W+256,H+256);x.restore();
 const v=x.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,W*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.85)');x.fillStyle=v;x.fillRect(0,0,W,H);
 x.fillStyle=`rgba(0,0,0,${rnd()*.06})`;x.fillRect(0,0,W,H);if(rnd()<.05){x.fillStyle='rgba(255,255,255,.15)';x.fillRect(rnd()*W,0,1,H)}
 x.fillStyle='#000';x.fillRect(0,0,W,40);x.fillRect(0,H-40,W,40);
 if(cur&&T-cur.t0<cur.d+1){const a=M.min(1,(T-cur.t0)/.6)*M.min(1,(cur.t0+cur.d+1-T)/.8);let ls=[cur.t];if(cur.t.length>62){const m=cur.t.length>>1,k=cur.t.indexOf(' ',m);if(k>0)ls=[cur.t.slice(0,k),cur.t.slice(k+1)]}
  x.save();x.textAlign='center';x.font='24px Georgia';x.shadowColor='#000';x.shadowBlur=8;x.fillStyle=`rgba(235,235,235,${a})`;ls.forEach((l,j)=>x.fillText(l,W/2,H-86+j*30));x.restore()}
 if(paused){x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,W,H);x.fillStyle='#aaa';x.font='28px Georgia';x.textAlign='center';x.fillText('PAUSED',W/2,H/2)}}
const SC=[sLetter,s1,s2,s3,sHall,sMirror,sBed,sFoot,sFinal];
function render(){const i=S.reduce((a,s,k)=>T>=s?k:a,0),lt_=j=>M.max(0,(T-S[j])/K[j]),fin=S[8];shake=T>=fin+23*K[8]&&T<fin+24.4*K[8]?1:0;
 x.save();x.fillStyle='#000';x.fillRect(0,0,W,H);if(shake)x.translate((rnd()-.5)*24,(rnd()-.5)*24);
 if(i>0&&T<S[i]+2){const p=sm((T-S[i])/2);if(i==4||i==8){if(p<.5){x.globalAlpha=1-p*2;SC[i-1](lt_(i-1))}else{x.globalAlpha=(p-.5)*2;SC[i](lt_(i))}}else{SC[i-1](lt_(i-1));x.globalAlpha=p;SC[i](lt_(i))}x.globalAlpha=1}else SC[i](lt_(i));
 x.restore();fx();post();
 const sil=T>=fin+24.4*K[8];if(i!==sceneI||sil!==silP){setAmb(i,sil);sceneI=i;silP=sil}}
function loop(now){requestAnimationFrame(loop);const dt=M.min(.05,(now-last)/1000||0);last=now;if(!playing)return;
 if(!paused){T=M.min(T+dt,END+8);while(evI<EV.length&&EV[evI].t<=T)EV[evI++].f();flash=M.max(0,flash-dt*3.4);if(strike2>0){strike2-=dt;if(strike2<=0)flash=1}
  RN.forEach(r=>{r.y+=r.v*dt;r.x-=r.v*.18*dt;if(r.y>H){r.y=-20;r.x=rnd()*W*1.2}if(r.x<-20)r.x+=W*1.2})}
 render()}
function seek(t){cur=null;window.speechSynthesis&&speechSynthesis.cancel();T=t;evI=EV.findIndex(e=>e.t>=t);if(evI<0)evI=EV.length;sceneI=-1}
document.getElementById('go').onclick=()=>{window.speechSynthesis&&speechSynthesis.getVoices();initAudio();if(AU.c.state==='suspended')AU.c.resume();const s=document.getElementById('start');s.style.opacity=0;setTimeout(()=>s.style.display='none',1600);
 playing=true;seek(0);last=performance.now();const h=document.getElementById('hint');setTimeout(()=>h.style.opacity=1,3000);setTimeout(()=>h.style.opacity=0,12000)};
addEventListener('keydown',e=>{if(!playing)return;const k=e.key.toLowerCase();
 if(k==' '){paused=!paused;paused?(AU.c.suspend(),window.speechSynthesis&&speechSynthesis.pause()):(AU.c.resume(),window.speechSynthesis&&speechSynthesis.resume());e.preventDefault()}
 else if(k=='r')seek(0);else if(k=='f')document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
 else if(k=='m'){mute=!mute;AU.m.gain.value=mute?0:.9;if(mute&&window.speechSynthesis)speechSynthesis.cancel()}else if('123456789'.includes(k)&&k)seek(S[+k-1])});
requestAnimationFrame(loop);
})();
