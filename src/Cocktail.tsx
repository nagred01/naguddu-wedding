import React,{useRef,useEffect,useState} from 'react';
import {EVENTS,mapUrl,type Lang} from './i18n';
import {EDIT_MODE,editKey,useEdits} from './editStore';
import clip from './img/cocktail-bride-mehendi.mp4';
import poster from './img/cocktail-full-twirl-poster.jpg';
import motion1 from './img/cocktail-motion-01.jpg';
import motion2 from './img/cocktail-motion-02.jpg';
import motion3 from './img/cocktail-motion-03.jpg';
import motion4 from './img/cocktail-motion-04.jpg';
import motion5 from './img/cocktail-motion-05.jpg';
import motion6 from './img/cocktail-motion-06.jpg';
import motion7 from './img/cocktail-motion-07.jpg';
import motion8 from './img/cocktail-motion-08.jpg';
import motion9 from './img/cocktail-motion-09.jpg';
import motion10 from './img/cocktail-motion-10.jpg';
const motionSheets=[motion1,motion2,motion3,motion4,motion5,motion6,motion7,motion8,motion9,motion10];
const FPS=12,FRAMES=120;
// The cheers plays once; after that only the twirl repeats, from TWIRL_FROM to TWIRL_TO (the clip dissolves back
// into TWIRL_FROM over its last moments, so the jump is smooth). Times in seconds.
const TWIRL_FROM=184/30,TWIRL_TO=279/30;
// The clink is held for two seconds (2.6s to 4.6s) so the title can be read; the ballroom comes in after that.
const HOLD=2;
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
 const copy=useRef<HTMLDivElement>(null),title=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [fallback,setFallback]=useState(true);
 const state=useRef({active,paused,fallback:true,time:0,last:0,frame:-1,noSeek:false});
 state.current.active=active;state.current.paused=paused;state.current.fallback=fallback;
 const sheets=useRef<HTMLImageElement[]>([]);
 const useFallback=()=>{const st=state.current;if(!st.active||st.paused)return;const v=video.current;if(v&&Number.isFinite(v.currentTime)&&v.currentTime>0)st.time=v.currentTime;st.last=0;setFallback(true);};
 const tryPlay=()=>{const v=video.current,st=state.current;if(!v||!st.active||st.paused||st.noSeek)return;v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');if(st.fallback&&v.readyState>=1&&Math.abs(v.currentTime-st.time)>.25)v.currentTime=st.time;v.play().catch(()=>{if(state.current.active&&!state.current.paused)setFallback(true)});};
 useEffect(()=>{if(warm&&!sheets.current.length)sheets.current=motionSheets.map(src=>{const img=new Image();img.src=src;return img;});},[warm]);
 useEffect(()=>{if(active){state.current.time=0;state.current.last=0;state.current.frame=-1;if(video.current)video.current.currentTime=0;setFallback(true);}},[active]);
 useEffect(()=>{const v=video.current;if(!v)return;if(!active||paused){v.pause();state.current.last=0;return;}const frame=requestAnimationFrame(tryPlay),retry=window.setTimeout(tryPlay,450);const onVisible=()=>{state.current.last=0;if(document.visibilityState==='visible')tryPlay();};document.addEventListener('visibilitychange',onVisible);const gestures=['touchstart','pointerdown','wheel'];gestures.forEach(n=>document.addEventListener(n,tryPlay,{passive:true,capture:true}));return()=>{cancelAnimationFrame(frame);clearTimeout(retry);document.removeEventListener('visibilitychange',onVisible);gestures.forEach(n=>document.removeEventListener(n,tryPlay,true));};},[active,paused]);
 useEffect(()=>{if(!active)return;let frame=0;const tick=(now:number)=>{const st=state.current,v=video.current,c=copy.current;
 if(st.fallback){if(!st.paused&&document.visibilityState==='visible'&&sheets.current.every(i=>i.complete&&i.naturalWidth)){if(st.last){st.time+=Math.min((now-st.last)/1000,.15);if(st.time>=TWIRL_TO)st.time=TWIRL_FROM+(st.time-TWIRL_TO);}st.last=now;}else st.last=0;
 const f=Math.min(FRAMES-1,Math.floor(st.time*FPS));const img=sheets.current[Math.floor(f/12)];const ctx=canvas.current?.getContext('2d');if(img?.complete&&img.naturalWidth&&ctx&&f!==st.frame){ctx.drawImage(img,(f%4)*352,Math.floor((f%12)/4)*614,352,614,0,0,352,614);st.frame=f;}}
 else if(v){if(v.currentTime>=TWIRL_TO||v.ended){
 // Jump back to the start of the twirl. If this browser or server can't seek in the video, carry on with the frame sheets instead.
 const s=v.seekable;let ok=false;for(let i=0;i<s.length;i++)if(s.start(i)<=TWIRL_FROM&&s.end(i)>=TWIRL_FROM)ok=true;
 if(ok){v.currentTime=TWIRL_FROM;if(v.paused&&!st.paused)v.play().catch(()=>{});}else{st.noSeek=true;v.pause();st.time=TWIRL_FROM;st.last=0;st.fallback=true;setFallback(true);}}
 if(!st.fallback){st.time=v.currentTime;st.last=0;st.frame=-1;}}
 const t=st.time;if(c){const reveal=Math.max(0,Math.min(1,(t-3.0-HOLD)/1.1));// The twirl text appears as the ballroom comes in and then stays (always visible while editing).
const o=EDIT_MODE?1:reveal;
// The title fades in with the hands and out just before the ballroom.
const h=title.current;if(h){const ho=Math.max(0,Math.min(1,(t-.5)/.6,(2.95+HOLD-t)/.4));h.style.opacity=EDIT_MODE?'0':String(ho);h.style.translate='0 '+((1-Math.min(1,Math.max(0,(t-.5)/.6)))*8)+'px';}c.style.opacity=String(o);c.style.translate=EDIT_MODE?'0 0':'0 '+((1-reveal)*6)+'px';c.style.pointerEvents=o>.5?'':'none';}if(canvas.current)canvas.current.dataset.time=t.toFixed(3);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[active]);
 return <section id="reception" data-sec="reception" data-editable="" data-mode={mode} data-unit={1} className={'sec event cocktail-reel cocktail-video-page cocktail-twirl-page'+(active?' motion-active':'')+(fallback?' frame-fallback':'')} aria-label={lang==='en'?'Cocktail party':'కాక్‌టెయిల్'}>
  <div className="cocktail-video-back" aria-hidden="true"/>
  <video ref={video} poster={poster} autoPlay={active&&!paused} onPlaying={()=>{if(state.current.active&&!state.current.paused)setFallback(false);}} onPause={useFallback} onError={useFallback} src={clip} className="cocktail-original-video" muted playsInline preload={warm?"auto":"none"} aria-label="Cocktail invitation animation"/>
  <canvas ref={canvas} width={352} height={614} className="cocktail-original-video cocktail-frame-animation" style={{visibility:fallback?'visible':'hidden'}} aria-label="Cocktail invitation animation"/>
  {/* Over the cheers: the "Happily ever after party" title, gone before the twirl begins. */}
  <div ref={title} className="cx-title" aria-hidden={EDIT_MODE?undefined:true} style={{opacity:0}}>
   <p className="cx-ever">HAPPILY EVER</p>
   <p className="cx-after">after<svg className="cx-heart" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 40C15 31 5 24 4 14 3 7 8 3 13 4c4 1 6 5 7 9 1-4 3-8 7-9 5-1 10 3 9 10-1 10-11 17-16 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>party</p>
  </div>
  <div ref={copy} className="cocktail-copy cx-copy" style={{opacity:EDIT_MODE?1:0}}>
   {piece('headline','Cocktail!','cx-headline','h2')}
   {piece('verse1','The knot is tied, the stars are bright…\n#NaGuddu’s calling it a cocktail night! 🥂','cx-verse')}
   <div className="cx-details">
    {piece('when','Friday, 4 December 2026, 6:00 PM onwards','cx-when')}
    {piece('venue',e.venue[lang],'cx-venue')}
    {piece('dress','Dress up in your Desi Bling! ✨','cx-attire')}
    {piece('map',lang==='en'?'Open in Maps':'మ్యాప్‌లో చూడండి','cocktail-map','a',{href:mapUrl(e.address),target:'_blank',rel:'noopener'})}
   </div>
  </div>
 </section>;
}
