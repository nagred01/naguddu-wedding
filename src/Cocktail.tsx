import React,{useRef,useEffect,useState} from 'react';
import {EVENTS,mapUrl,type Lang} from './i18n';
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
 const copy=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [fallback,setFallback]=useState(true);
 const state=useRef({active,paused,fallback:true,time:0,last:0,frame:-1,shown:false});
 state.current.active=active;state.current.paused=paused;state.current.fallback=fallback;
 const sheets=useRef<HTMLImageElement[]>([]);
 const useFallback=()=>{const st=state.current;if(!st.active||st.paused)return;const v=video.current;if(v&&Number.isFinite(v.currentTime)&&v.currentTime>0)st.time=v.currentTime;st.last=0;setFallback(true);};
 const tryPlay=()=>{const v=video.current,st=state.current;if(!v||!st.active||st.paused)return;v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');if(st.fallback&&v.readyState>=1&&Math.abs(v.currentTime-st.time)>.25)v.currentTime=st.time;v.play().catch(()=>{if(state.current.active&&!state.current.paused)setFallback(true)});};
 useEffect(()=>{if(warm&&!sheets.current.length)sheets.current=motionSheets.map(src=>{const img=new Image();img.src=src;return img;});},[warm]);
 useEffect(()=>{if(active){state.current.time=0;state.current.last=0;state.current.frame=-1;state.current.shown=false;if(video.current)video.current.currentTime=0;setFallback(true);}},[active]);
 useEffect(()=>{const v=video.current;if(!v)return;if(!active||paused){v.pause();state.current.last=0;return;}const frame=requestAnimationFrame(tryPlay),retry=window.setTimeout(tryPlay,450);const onVisible=()=>{state.current.last=0;if(document.visibilityState==='visible')tryPlay();};document.addEventListener('visibilitychange',onVisible);const gestures=['touchstart','pointerdown','wheel'];gestures.forEach(n=>document.addEventListener(n,tryPlay,{passive:true,capture:true}));return()=>{cancelAnimationFrame(frame);clearTimeout(retry);document.removeEventListener('visibilitychange',onVisible);gestures.forEach(n=>document.removeEventListener(n,tryPlay,true));};},[active,paused]);
 useEffect(()=>{if(!active)return;let frame=0;const tick=(now:number)=>{const st=state.current,v=video.current,c=copy.current;
 if(st.fallback){if(!st.paused&&document.visibilityState==='visible'&&sheets.current.every(i=>i.complete&&i.naturalWidth)){if(st.last)st.time=(st.time+Math.min((now-st.last)/1000,.15))%LOOP;st.last=now;}else st.last=0;
 const f=Math.min(FRAMES-1,Math.floor(st.time*FPS));const img=sheets.current[Math.floor(f/12)];const ctx=canvas.current?.getContext('2d');if(img?.complete&&img.naturalWidth&&ctx&&f!==st.frame){ctx.drawImage(img,(f%4)*352,Math.floor((f%12)/4)*614,352,614,0,0,352,614);st.frame=f;}}
 else if(v){st.time=v.currentTime;st.last=0;st.frame=-1;}
 const t=st.time;if(c){const reveal=Math.max(0,Math.min(1,(t-2.7)/1.3)),outro=Math.max(0,Math.min(1,(LOOP-t)/.65));if(reveal>=1)st.shown=true;c.style.opacity=st.shown?'1':String(reveal*outro);c.style.translate=st.shown?'0 0':'0 '+((1-reveal)*6)+'px';}if(canvas.current)canvas.current.dataset.time=t.toFixed(3);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[active]);
 return <section id="reception" data-sec="reception" className={'sec event cocktail-reel cocktail-video-page cocktail-twirl-page'+(active?' motion-active':'')+(fallback?' frame-fallback':'')} aria-label={lang==='en'?'Cocktail party':'కాక్‌టెయిల్'}>
  <div className="cocktail-video-back" aria-hidden="true"/>
  <video ref={video} poster={poster} autoPlay={active&&!paused} onPlaying={()=>{if(state.current.active&&!state.current.paused)setFallback(false);}} onPause={useFallback} onError={useFallback} src={clip} className="cocktail-original-video" muted playsInline loop preload={warm?"auto":"none"} aria-label="Cocktail invitation animation"/>
  <canvas ref={canvas} width={352} height={614} className="cocktail-original-video cocktail-frame-animation" style={{visibility:fallback?'visible':'hidden'}} aria-label="Cocktail invitation animation"/>
  <div ref={copy} className="cocktail-copy" style={{opacity:0}}>
   <p className="cocktail-kicker">{lang==='en'?'BHAVITHA & NAGENDER':'భవిత & నాగేందర్'}</p>
   <h2>{lang==='en'?'COCKTAIL PARTY':'కాక్‌టెయిల్ పార్టీ'}</h2>
   <p className="cocktail-sub">{lang==='en'?'An After-Wedding Celebration':'వివాహానంతర వేడుక'}</p>
   <p className="cocktail-theme">{lang==='en'?'A Night under the Stars':'నక్షత్రాల కింద ఓ వేడుక'}</p>
   <div className="cocktail-details">
    <p>{lang==='en'?'FRIDAY, DECEMBER 4, 2026':'శుక్రవారం, డిసెంబర్ 4, 2026'}</p>
    <p className="cocktail-time">{e.time[lang]}</p>
    <p className="cocktail-venue">{e.venue[lang]}</p>
    <p className="cocktail-dress">{e.dress[lang]}</p>
    <a className="cocktail-map" href={mapUrl(e.address)} target="_blank" rel="noopener">{lang==='en'?'Open in Maps':'మ్యాప్‌లో చూడండి'}</a>
   </div>
  </div>
 </section>;
}
