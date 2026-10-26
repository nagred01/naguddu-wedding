import React,{useRef,useEffect,useState} from 'react';
import {EVENTS,mapUrl,type Lang} from './i18n';
import {EDIT_MODE,editKey,useEdits} from './editStore';
import clip from './img/cocktail-full-twirl-v5.mp4';
import poster from './img/cocktail-full-twirl-poster.jpg';
import motion1 from './img/cocktail-motion-01.jpg';
import motion2 from './img/cocktail-motion-02.jpg';
import motion3 from './img/cocktail-motion-03.jpg';
import motion4 from './img/cocktail-motion-04.jpg';
import motion5 from './img/cocktail-motion-05.jpg';
import motion6 from './img/cocktail-motion-06.jpg';
import motion7 from './img/cocktail-motion-07.jpg';
import motion8 from './img/cocktail-motion-08.jpg';
const motionSheets=[motion1,motion2,motion3,motion4,motion5,motion6,motion7,motion8];
const LOOP=7.966667,FPS=12,FRAMES=96;
export function Cocktail({lang,active,near,paused}:{lang:Lang;active:boolean;near:boolean;paused:boolean}){
 // The video and its frame sheets are ~8 MB: start fetching only once the guest is close to this page, then keep them.
 const [warm,setWarm]=useState(false);
 useEffect(()=>{if(near)setWarm(true);},[near]);
 const e=EVENTS.find(e=>e.id==='reception')!;const video=useRef<HTMLVideoElement>(null);
 // Layout editor support: every text line is a piece that can be moved, resized, restyled and reworded.
 const edits=useEdits();
 const [wide,setWide]=useState(()=>typeof window!=='undefined'&&window.innerWidth>=900);
 useEffect(()=>{const on=()=>setWide(window.innerWidth>=900);window.addEventListener('resize',on);return()=>window.removeEventListener('resize',on);},[]);
 const mode=wide?'desktop':'phone';
 const E=(p:string)=>edits[editKey('reception',mode,p)]||{};
 const piece=(p:string,text:string,cls?:string,Tag:any='p',extra:any={})=>{
  const d=E(p);const words=d.text?.[lang];
  // Width: the line's box grows or shrinks around its centre.
  const w=d.w||1;
  return <Tag className={cls} data-piece={p} data-wh="w" data-font={d.font?'':undefined} {...extra}
   style={{width:w!==1?(w*100)+'%':undefined,marginLeft:w!==1?`calc(${d.dx||0}px + ${(1-w)*50}%)`:d.dx||0,marginTop:d.dy||0,scale:d.scale?String(d.scale):undefined,['--piece-font' as any]:d.font||undefined,zoom:d.fs||undefined,display:Tag==='a'?'inline-flex':undefined,position:'relative'}}>
   {words??text}</Tag>;
 };
 const copy=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [fallback,setFallback]=useState(true);
 const state=useRef({active,paused,fallback:true,time:0,last:0,frame:-1});
 state.current.active=active;state.current.paused=paused;state.current.fallback=fallback;
 const sheets=useRef<HTMLImageElement[]>([]);
 const useFallback=()=>{const st=state.current;if(!st.active||st.paused)return;const v=video.current;if(v&&Number.isFinite(v.currentTime)&&v.currentTime>0)st.time=v.currentTime;st.last=0;setFallback(true);};
 const tryPlay=()=>{const v=video.current,st=state.current;if(!v||!st.active||st.paused)return;v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');if(st.fallback&&v.readyState>=1&&Math.abs(v.currentTime-st.time)>.25)v.currentTime=st.time;v.play().catch(()=>{if(state.current.active&&!state.current.paused)setFallback(true)});};
 useEffect(()=>{if(warm&&!sheets.current.length)sheets.current=motionSheets.map(src=>{const img=new Image();img.src=src;return img;});},[warm]);
 useEffect(()=>{if(active){state.current.time=0;state.current.last=0;state.current.frame=-1;if(video.current)video.current.currentTime=0;setFallback(true);}},[active]);
 useEffect(()=>{const v=video.current;if(!v)return;if(!active||paused){v.pause();state.current.last=0;return;}const frame=requestAnimationFrame(tryPlay),retry=window.setTimeout(tryPlay,450);const onVisible=()=>{state.current.last=0;if(document.visibilityState==='visible')tryPlay();};document.addEventListener('visibilitychange',onVisible);const gestures=['touchstart','pointerdown','wheel'];gestures.forEach(n=>document.addEventListener(n,tryPlay,{passive:true,capture:true}));return()=>{cancelAnimationFrame(frame);clearTimeout(retry);document.removeEventListener('visibilitychange',onVisible);gestures.forEach(n=>document.removeEventListener(n,tryPlay,true));};},[active,paused]);
 useEffect(()=>{if(!active)return;let frame=0;const tick=(now:number)=>{const st=state.current,v=video.current,c=copy.current;
 if(st.fallback){if(!st.paused&&document.visibilityState==='visible'&&sheets.current.every(i=>i.complete&&i.naturalWidth)){if(st.last)st.time=(st.time+Math.min((now-st.last)/1000,.15))%LOOP;st.last=now;}else st.last=0;
 const f=Math.min(FRAMES-1,Math.floor(st.time*FPS));const img=sheets.current[Math.floor(f/12)];const ctx=canvas.current?.getContext('2d');if(img?.complete&&img.naturalWidth&&ctx&&f!==st.frame){ctx.drawImage(img,(f%4)*352,Math.floor((f%12)/4)*614,352,614,0,0,352,614);st.frame=f;}}
 else if(v){st.time=v.currentTime;st.last=0;st.frame=-1;}
 const t=st.time;if(c){const reveal=Math.max(0,Math.min(1,(t-2.7)/1.3)),outro=Math.max(0,Math.min(1,(LOOP-t)/.65));// The text appears after the glasses clink and fades out before the clip starts again (always visible while editing).
const o=EDIT_MODE?1:reveal*outro;c.style.opacity=String(o);c.style.translate=EDIT_MODE?'0 0':'0 '+((1-reveal)*6)+'px';c.style.pointerEvents=o>.5?'':'none';}if(canvas.current)canvas.current.dataset.time=t.toFixed(3);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[active]);
 return <section id="reception" data-sec="reception" data-editable="" data-mode={mode} data-unit={1} className={'sec event cocktail-reel cocktail-video-page cocktail-twirl-page'+(active?' motion-active':'')+(fallback?' frame-fallback':'')} aria-label={lang==='en'?'Cocktail party':'కాక్‌టెయిల్'}>
  <div className="cocktail-video-back" aria-hidden="true"/>
  <video ref={video} poster={poster} autoPlay={active&&!paused} onPlaying={()=>{if(state.current.active&&!state.current.paused)setFallback(false);}} onPause={useFallback} onError={useFallback} src={clip} className="cocktail-original-video" muted playsInline loop preload={warm?"auto":"none"} aria-label="Cocktail invitation animation"/>
  <canvas ref={canvas} width={352} height={614} className="cocktail-original-video cocktail-frame-animation" style={{visibility:fallback?'visible':'hidden'}} aria-label="Cocktail invitation animation"/>
  <div ref={copy} className="cocktail-copy" style={{opacity:EDIT_MODE?1:0}}>
   {piece('theme',lang==='en'?'A Night under the Stars':'నక్షత్రాల కింద ఓ వేడుక','cocktail-theme')}
   <div className="cocktail-details">
    {piece('date',lang==='en'?'FRIDAY, DECEMBER 4, 2026':'శుక్రవారం, డిసెంబర్ 4, 2026')}
    {piece('time',e.time[lang],'cocktail-time')}
    {piece('venue',e.venue[lang],'cocktail-venue')}
    {piece('dress',e.dress[lang],'cocktail-dress')}
    {piece('map',lang==='en'?'Open in Maps':'మ్యాప్‌లో చూడండి','cocktail-map','a',{href:mapUrl(e.address),target:'_blank',rel:'noopener'})}
   </div>
  </div>
 </section>;
}
