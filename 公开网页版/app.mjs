import {initialState,calculate,applyActions,rayAt,GAP} from './optics.mjs';
const $=s=>document.querySelector(s);
let state=initialState(),visual={...state},history=[],busy=false,configured=false,animation;
const eye=$('#eye'),ctx=eye.getContext('2d'),board=$('#board'),b=board.getContext('2d');
const scene=document.createElement('canvas');scene.width=620;scene.height=450;
const sc=scene.getContext('2d');
sc.fillStyle='#164c40';sc.fillRect(0,0,620,450);sc.strokeStyle='#bfa478';sc.lineWidth=20;sc.strokeRect(10,10,600,430);
sc.fillStyle='#f6f6df';sc.textAlign='center';sc.font='bold 48px "Microsoft YaHei",sans-serif';sc.fillText('眼 和 视 觉',310,126);
sc.font='38px "Microsoft YaHei",sans-serif';sc.fillText('光进入眼睛',310,220);sc.fillText('我们怎样看清世界？',310,300);
sc.strokeStyle='#e7ebcc';sc.lineWidth=2;sc.beginPath();sc.moveTo(95,150);sc.lineTo(525,150);sc.stroke();
function line(points,color,width=3,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
function label(text,x,y,color='#366768',align='center',size=23){ctx.fillStyle=color;ctx.font=`${size}px "Microsoft YaHei",sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);}
function draw(){
 const r=calculate(visual),scale=24,x0=410,y0=232,retina=x0+visual.lengthMm*scale,sp=x0-GAP*1000*scale,focus=x0+r.focusMm*scale;
 ctx.clearRect(0,0,1000,450);
 ctx.fillStyle='#eff8f5';ctx.strokeStyle='#c2ddd5';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse((retina+345)/2,y0,(retina-345)/2,149,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 line([[40,y0],[975,y0]],'#d4e5de',2,[7,7]);
 // The orange straight section represents the retinal plane in this paraxial model.
 line([[retina,100],[retina,364]],'#e88c42',7);
 ctx.fillStyle='#a7dadc88';ctx.strokeStyle='#6bb8b9';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x0,y0,19,107,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(Math.abs(visual.lensD)>.001){
  const concave=visual.lensD<0;ctx.fillStyle='#c8eaf399';ctx.strokeStyle='#408caa';ctx.lineWidth=3;ctx.beginPath();
  if(concave){ctx.moveTo(sp-13,y0-107);ctx.quadraticCurveTo(sp+8,y0,sp-13,y0+107);ctx.lineTo(sp+13,y0+107);ctx.quadraticCurveTo(sp-8,y0,sp+13,y0-107);ctx.closePath();}
  else ctx.ellipse(sp,y0,18,107,0,0,Math.PI*2);ctx.fill();ctx.stroke();label(concave?'凹透镜':'凸透镜',sp,389,'#408caa');
 }else label('无矫正镜片',sp,389,'#7f9690', 'center',19);
 for(const h of [-.0013,0,.0013]){
  const yy=x=>y0-rayAt(visual,h,x)*65000;
  const yIn=y0-h*65000;
  line([[40,yIn],[sp,yIn],[x0,yy(0)],[retina,yy(visual.lengthMm/1000)]],'#159ca6',3);
  if(r.focusMm>visual.lengthMm+.08&&focus<980)line([[retina,yy(visual.lengthMm/1000)],[focus,y0]],'#89b9b8',2,[6,6]);
 }
 if(focus<980){ctx.fillStyle='#bd5269';ctx.beginPath();ctx.arc(focus,y0,6,0,Math.PI*2);ctx.fill();line([[focus,y0-16],[focus,68]],'#bd5269',1.5,[4,5]);label(r.position==='on'?'焦点与视网膜重合':'几何焦点',focus,49,'#a44a60');}
 label('平行光',92,103,'#159ca6');label('眼内折光',x0,415);label('视网膜',retina,415,'#c47832');
 if(r.position==='behind')label('虚线为几何延长线',790,95,'#718d86','center',17);
 b.clearRect(0,0,620,450);b.fillStyle='#164c40';b.fillRect(0,0,620,450);
 b.save();b.filter=`blur(${Math.min(13,r.blurDiameterMm*29)}px)`;b.drawImage(scene,0,0);b.restore();
 $('#clarity').textContent=r.position==='on'?'清晰':`模糊 · 像在${r.positionText}`;
}
function update(next,{source='手动实验 · 光学计算',explanation=''}={}){
 state={...next};const r=calculate(state);$('#fact').textContent=r.fact;$('#source').textContent=source;$('#explanation').textContent=explanation;
 $('#eye-type').textContent=state.lengthMm>17.08?'长眼轴示例':state.lengthMm<16.92?'短眼轴示例':'正常眼示例';
 $('#length').value=state.lengthMm;$('#length-value').value=state.lengthMm>17.08?'较长':state.lengthMm<16.92?'较短':'正常';
 cancelAnimationFrame(animation);const start={...visual},time=performance.now();
 const step=now=>{const t=Math.min(1,(now-time)/600),q=1-(1-t)**3;visual={lengthMm:start.lengthMm+(state.lengthMm-start.lengthMm)*q,lensD:start.lensD+(state.lensD-start.lensD)*q};draw();if(t<1)animation=requestAnimationFrame(step);};animation=requestAnimationFrame(step);
}
function manual(action){if(busy)return;history=[];update(applyActions(state,[action]).state);}
document.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>manual({type:el.dataset.action}));
document.querySelectorAll('[data-lens]').forEach(el=>el.onclick=()=>manual({type:'lens',lens:el.dataset.lens}));
$('#length').oninput=e=>manual({type:'set_length',valueMm:Number(e.target.value)});
document.querySelectorAll('[data-prompt]').forEach(el=>el.onclick=()=>{$('#command').value=el.dataset.prompt;$('#command').focus();});
$('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
function demoActions(text){
 const t=text.toLowerCase(); const actions=[];
 if(/恢复|正常眼|回到正常/.test(t)) actions.push({type:'normal'});
 else if(/拉长|变长|长一点|近视/.test(t)) actions.push({type:'long_eye'});
 else if(/缩短|变短|短一点|远视/.test(t)) actions.push({type:'short_eye'});
 if(/凹透镜|凹镜|凹/.test(t)) actions.push({type:'lens',lens:'concave'});
 else if(/凸透镜|凸镜|凸/.test(t)) actions.push({type:'lens',lens:'convex'});
 else if(/不戴|取消镜片|无镜片/.test(t)) actions.push({type:'lens',lens:'none'});
 if(!actions.length) actions.push({type:'observe'});
 return actions;
}
function demoExplanation(text,result,actions){
 const names=actions.map(a=>a.type==='long_eye'?'把眼球拉长':a.type==='short_eye'?'把眼球缩短':a.type==='normal'?'恢复正常眼':a.type==='lens'?(a.lens==='concave'?'换成凹透镜':a.lens==='convex'?'换成凸透镜':'取下镜片'):'观察').join('，');
 const advice=result.position==='on'?'焦点落在视网膜上，黑板清晰。':`焦点落在${result.positionText}，所以黑板会模糊；可以尝试${result.suggestedLens}。`;
 return `演示助手已将“${text}”理解为：${names}。${advice}`;
}
$('#command-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;
 const text=$('#command').value.trim();if(!text)return;
 busy=true;$('#send').disabled=true;$('#send').textContent='演示助手正在操作…';$('#status').textContent='公开演示 · 已响应';$('#hint').textContent='操作由演示规则转换，结果由光学模型计算';
 try{
  const actions=demoActions(text); const data=applyActions(state,actions); const explanation=demoExplanation(text,data.result,actions);
  update(data.state,{source:'演示助手已操作 · 光学计算结果',explanation});
  history=[...history,{role:'user',content:text},{role:'assistant',content:JSON.stringify({actions,explanation})}].slice(-6);
  $('#command').value='';
 }catch(error){$('#status').textContent='演示操作失败';$('#status').className='badge error';$('#hint').textContent=error.message;}
 finally{busy=false;$('#send').disabled=false;$('#send').textContent='请演示助手操作';}
};
update(state,{source:'公开演示 · 光学计算'});draw();
configured=true;$('#status').textContent='公开演示 · 无需密钥';$('#hint').textContent='输入一句话，演示助手会把它转换成实验操作';
