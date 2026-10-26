import React, {useEffect,useRef,useState} from 'react';
import {layoutTemplates,savedLayout} from './layoutData';
import {EVENTS,T,mapUrl,type Lang} from './i18n';
import {editKey,useEdits} from './editStore';
const extraId='extra-mvfzb6jt-dfklno';
// Google Maps link per event, from its address. An event without an address shows no "Open in Maps" button.
// Desktop title colour per event, matching each page's palette.
const TITLE_COLOR:Record<string,string>={pasupu:'#7a4300',mehandi:'#f3d98a',pellikuthuru:'#5a3a08',vivaham:'#8a2a1a'};
// Desktop nudges [x, y] in layout units where an artwork's figures sit off-centre inside their image.
const ART_NUDGE:Record<string,Record<string,[number,number]>>={vivaham:{image2:[25,60]},pellikuthuru:{image2:[20,35]}};
const MAPS:Record<string,string>=Object.fromEntries(EVENTS.map(e=>[e.id,e.address?mapUrl(e.address):'']));
const teluguEdits:Record<string,Record<string,string>>={
 pellikuthuru:{title:'పెళ్లికూతురు',[extraId]:'పెళ్లికొడుకు'}
};
// A line under the title.
const SUBTITLE:Record<string,Partial<Record<Lang,string>>>={pasupu:{te:'మంగళ స్నానం'}};
// Phone artwork enlarged in place (kept anchored at its top-right corner, growing down into free space).
// Phone pieces moved [x, y] in layout units, where the Telugu wording runs longer than the saved layout allows.
const PHONE_NUDGE:Record<string,Record<string,[number,number]>>={pellikuthuru:{details:[0,-22],image2:[0,16]}};
const PHONE_ART_SCALE:Record<string,Record<string,number>>={mehandi:{image2:1.15}};
function htmlEscape(s:string){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
export function SavedEvent({id,lang,active}:{id:string;lang:Lang;active:boolean}){
 const ref=useRef<HTMLElement>(null);const [size,setSize]=useState({w:390,h:844});
 useEffect(()=>{if(!ref.current)return;const ro=new ResizeObserver(([e])=>setSize({w:e.contentRect.width,h:e.contentRect.height}));ro.observe(ref.current);return()=>ro.disconnect();},[]);
 const e=layoutTemplates[lang].find((x:any)=>x.id===id);const base=layoutTemplates.en.find((x:any)=>x.id===id);const items=(savedLayout.events as any)[id];
 const desktop=size.w>=900;const top=desktop?96:0,bottom=desktop?28:0;const available=size.h-top-bottom;
 const fit=Math.min(size.w/390,available/844);const offset=(size.w-390*fit)/2;
 const desktopScale=Math.min(1.25,available/700);
 // Edits from the local layout editor (layoutEdits.json): move, size, text size, font and wording per piece.
 const edits=useEdits();const mode=desktop?'desktop':'phone';const unit=desktop?Math.min(size.w/1280,size.h/800):fit;
 const E=(p:string)=>edits[editKey(id,mode,p)]||{};
 const fx=(p:string,st:React.CSSProperties):React.CSSProperties=>{const d=E(p);return {...st,marginLeft:(d.dx||0)*unit,marginTop:(d.dy||0)*unit,scale:d.scale?String(d.scale):undefined,['--piece-font' as any]:d.font||undefined};};
 const fontAttr=(p:string)=>E(p).font?'':undefined;
 const titleLines=(fallback:string)=>{const o=E('title').text?.[lang];return o?o.split('\n'):[fallback];};
 return <section ref={ref} id={id} data-sec={id} data-editable="" data-mode={mode} data-unit={unit} className={'sec event saved-event world-'+id+(active?' motion-active':'')}>
  <div className="event-glow" aria-hidden="true"/>
  <div className="saved-layout" aria-label={id+' event'}>
   {items.filter((i:any)=>!i.hidden&&i.id!=='verse'&&(i.id!=='map'||MAPS[id])).map((i:any)=>{
    const t=e.items.find((x:any)=>x.id===i.id);const original=base.items.find((x:any)=>x.id===i.id);
    let html='';const rich=i.type==='rich';const edited=i.text!==null&&i.text!==undefined;
    const words=E(i.id).text?.[lang]??(lang==='te'?teluguEdits[id]?.[i.id]:undefined);
    if(rich){html=i.rich;if(words){const div=document.createElement('div');div.innerHTML=html;const walker=document.createTreeWalker(div,NodeFilter.SHOW_TEXT);let first=true,n;while(n=walker.nextNode()){if(first){n.textContent=words;first=false;}else n.textContent='';}html=div.innerHTML;}}
    else if(edited){const text=lang==='te'?(teluguEdits[id]?.[i.id]??i.text):i.text;html='<div style="white-space:pre-wrap;font:'+(i.id==='title'?'28px Georgia,serif':'14px/1.5 Georgia,serif')+';text-align:'+(i.id==='details'?'left':'center')+';color:'+(id==='mehandi'||id==='reception'?'#f6e8bd':'#4a2f00')+'">'+htmlEscape(text)+'</div>';}
    else html=t?.html||original?.html||'';
    // Load artwork only as the guest scrolls near it, so the first visit stays light on phones.
    html=html.replace(/<img /g,'<img loading="lazy" decoding="async" ');
    if(i.id==='map')html='<a href="'+htmlEscape(MAPS[id])+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">'+html.replace(/\s*\((link to add|లింక్ జోడించాలి)\)/,'')+'</a>';
    const art=i.id==='image1'||i.id==='image2';
    let s=fit,width=i.w*s,height=i.h*s,x=offset+i.x*s,y=top+i.y*fit;
    const ev=EVENTS.find(x=>x.id===id)!;const sub=SUBTITLE[id]?.[lang];
    // Wedding keeps its original layout title on phones.
    if(!desktop&&i.id==='title'&&id!=='pellikuthuru'&&id!=='vivaham'){
     // One clear line at the layout's title spot, in either language.
     const [tt,ts=sub]=titleLines(lang==='en'?ev.en:ev.te);
     return <h2 key={i.id} className="saved-piece motion-title ev-title" data-piece="title" data-wh="" data-font={fontAttr('title')} style={fx('title',{left:offset+(i.x+i.w/2)*fit,top:y,transform:'translateX(-50%)',fontSize:28*fit*(E('title').fs||1),color:TITLE_COLOR[id],zIndex:i.z,whiteSpace:'nowrap'})}>{tt}{ts&&<span className="ev-sub">{ts}</span>}</h2>;
    }
    const grow=!desktop&&PHONE_ART_SCALE[id]?.[i.id];
    if(grow){x-=width*(grow-1);width*=grow;height*=grow;s*=grow;}
    const nudge=!desktop&&PHONE_NUDGE[id]?.[i.id];
    if(nudge){x+=nudge[0]*fit;y+=nudge[1]*fit;}
    if(desktop){
     // A composed landscape spread rather than scattering small pieces across a laptop.
     const u=Math.min(size.w/1280,size.h/800);const cx=size.w/2;const cy=size.h/2;
     s=1.15*u;width=i.w*s;height=i.h*s;
     x=cx-width/2;y=cy-150*u;
     if(i.id==='ganesha'){width=60*u;height=70*u;x=cx-width/2;y=92*u;}
     else if(i.id==='title'){
      // One title style on every event page, centred under Ganesha; it names both sides on Pellikuthuru.
      const [tt,ts=sub]=titleLines(lang==='en'?ev.en:ev.te);
      return <h2 key={i.id} className="saved-piece motion-title ev-title" data-piece="title" data-wh="" data-font={fontAttr('title')} style={fx('title',{left:0,right:0,top:168*u,fontSize:38*u*(E('title').fs||1),color:TITLE_COLOR[id],zIndex:i.z})}>{tt}{ts&&<span className="ev-sub">{ts}</span>}</h2>;
     }
     else if(i.id.startsWith('extra-'))return null;
     else if(i.id==='number'){y=143*u;}
     // Artworks mirror each other around the centre line, leaving the middle column for the text.
     else if(art){s=1.9*u;width=i.w*s;height=i.h*s;const [dx,dy]=ART_NUDGE[id]?.[i.id]??[0,0];x=(i.id==='image1'?cx-215*u-width:cx+215*u)+dx*u;y=cy-height/2+(20+dy)*u;}
     else if(i.id==='details'){y=(sub?262:238)*u;}
     else if(i.id==='map'){s=1.1*u;width=i.w*s;height=i.h*s;x=cx-width/2;y=size.h-76*u;}
    }
    // Width and height from the layout editor.
    {const d=E(i.id);width*=d.w||1;height*=d.h||1;}
    if(i.id==='details'){
     // Rendered outside the scaled canvas so date, time and venue keep a readable size on small phones.
     const k=desktop?Math.min(1.15,Math.max(1,s)):Math.max(.92,Math.min(1,fit));
     // On desktop, stay in the gap between the two artworks: wide blocks keep their left edge, narrow ones stay centred.
     // On desktop the block is centred on the page axis, under the title.
     if(desktop){const u=Math.min(size.w/1280,size.h/800);width=340*u;x=size.w/2-width/2;}
     // On phones the canvas shrinks and leaves side margins: let the text use them instead of wrapping.
     // Wide phones: stay inside the artwork's column so the facts keep two columns and clear the lyrics.
     else if(i.w>=300){width=Math.min(size.w-32,374*fit);x=Math.max(16,size.w/2-width/2);}
     else if(sub){y+=24*fit;width=Math.max(width,size.w-14-x);}
     else width=Math.max(width,size.w-14-x);
     // Values can be reworded in the layout editor: one line each for date, time, venue and dress code.
     const say=E('details').text?.[lang]?.split('\n')||[];
     const rows:[string,string][]=[[T.date[lang],say[0]||ev.date[lang]],[T.time[lang],say[1]||ev.time[lang]],[T.venue[lang],say[2]||ev.venue[lang]],[T.dress[lang],say[3]||ev.dress[lang]]];
     return <div key={i.id} className="saved-piece motion-details" data-piece="details" data-wh="w" data-font={fontAttr('details')} style={fx('details',{left:x,top:y,width,zIndex:i.z,['--k' as any]:k*(E('details').fs||1)})}>
      <dl className={'ev-facts'+(id==='mehandi'?' light':'')}>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
     </div>;
    }
    const motion=i.id==='ganesha'?'g':i.id==='number'?'n':i.id==='title'?'title':i.id==='image1'?'a1':i.id==='image2'?'a2':i.id==='details'?'details':i.id==='map'?'map':'text';
    return <div key={i.id} className={'saved-piece motion-'+motion} data-piece={i.id} data-font={fontAttr(i.id)} style={fx(i.id,{left:x,top:y,width,height,zIndex:i.z})}>
     <div className={art?'saved-float':'saved-still'}><div className={'saved-content'+(rich?' saved-rich':'')} style={{width:rich?i.w:(original?.w??i.w),height:rich?i.h:(original?.h??i.h),transform:rich?`scale(${s})`:`scale(${width/(original?.w??i.w)},${height/(original?.h??i.h)})`}} dangerouslySetInnerHTML={{__html:html}}/></div>
    </div>;
   })}
  </div>
 </section>;
}
