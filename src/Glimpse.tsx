import React from 'react';
import {type Lang} from './i18n';
import haldi from './img/haldi-c1.webp';
import mehendi from './img/c-mehandi.webp';
import bride from './img/pellikuthuru-k.webp';
import groom from './img/pellikoduku-k.webp';
import wedding from './img/wedding-couple2.webp';
import cocktail from './img/c-recep.webp';
// The background template, in pieces so each keeps its shape on any screen: paper, banana plant, kolam and corners.
import paper from './img/itin-paper.jpg';
import bananaArt from './img/itin-banana.webp';
import kolam from './img/itin-kolam.webp';
import cornerL from './img/itin-corner-l.webp';
import cornerR from './img/itin-corner-r.webp';
// All five events as one calendar file: phones and computers offer to add them all to the guest's calendar.
import calendar from './naguddu-wedding.ics';

type L = {en: string; te: string};
const ROWS: {id: string; day: L; date: string; name: L; time: L; venue: string; attire: L; art: string[]}[] = [
  {id: 'pasupu', day: {en: 'Tue', te: 'మంగళ'}, date: '1', name: {en: 'Haldi', te: 'నలుగు'}, time: {en: '9:30 AM · followed by lunch', te: 'ఉదయం 9:30 · తర్వాత భోజనం'}, venue: 'Serengeti Events (Airbnb)', attire: {en: 'Your favorite hue of yellow', te: 'పసుపు రంగు దుస్తులు'}, art: [haldi]},
  {id: 'mehandi', day: {en: 'Tue', te: 'మంగళ'}, date: '1', name: {en: 'Mehendi', te: 'మెహందీ'}, time: {en: '4:00 PM · followed by dinner', te: 'సాయంత్రం 4:00 · తర్వాత విందు'}, venue: 'Serengeti Events (Airbnb)', attire: {en: 'Festive shades of green', te: 'ఆకుపచ్చ రంగు దుస్తులు'}, art: [mehendi]},
  {id: 'pellikuthuru', day: {en: 'Wed', te: 'బుధ'}, date: '2', name: {en: 'Pellikuthuru / Pellikoduku', te: 'పెళ్లికూతురు / పెళ్లికొడుకు'}, time: {en: '10:00 AM · followed by lunch', te: 'ఉదయం 10:00 · తర్వాత భోజనం'}, venue: 'Serengeti Events (Airbnb)', attire: {en: 'Traditional Indian attire', te: 'సంప్రదాయ దుస్తులు'}, art: [bride, groom]},
  {id: 'vivaham', day: {en: 'Thu', te: 'గురు'}, date: '3', name: {en: 'Wedding', te: 'సుముహూర్తం'}, time: {en: '9:00 AM · followed by lunch', te: 'ఉదయం 9:00 · తర్వాత భోజనం'}, venue: 'Bella Cavalli Events', attire: {en: 'Bring out your silks', te: 'పట్టు వస్త్రాలు'}, art: [wedding]},
  {id: 'reception', day: {en: 'Fri', te: 'శుక్ర'}, date: '4', name: {en: 'Cocktail', te: 'కాక్‌టెయిల్'}, time: {en: '6:00 PM · followed by dinner', te: 'సాయంత్రం 6:00 · తర్వాత విందు'}, venue: 'The Meridian Venue', attire: {en: 'Desi bling ✨', te: 'దేశీ మెరుపులు ✨'}, art: [cocktail]},
];

export function Glimpse({lang}: {lang: Lang}) {
  const en = lang === 'en';
  return (
    <section id="glimpse" data-sec="glimpse" className="sec itin" style={{backgroundImage: `url(${paper})`}} aria-label={en ? 'All events' : 'అన్ని వేడుకలు'}>
      <img className="itin-deco itin-deco-banana" src={bananaArt} alt="" aria-hidden="true" />
      <img className="itin-deco itin-deco-kolam" src={kolam} alt="" aria-hidden="true" />
      <img className="itin-deco itin-deco-cl" src={cornerL} alt="" aria-hidden="true" />
      <img className="itin-deco itin-deco-cr" src={cornerR} alt="" aria-hidden="true" />
      <div className="itin-body">
        <header className="itin-head">
          <h2>{en ? 'Wedding Itinerary' : 'వివాహ వేడుకలు'}</h2>
          <p>{en ? 'Bhavitha & Nagender · December 2026' : 'భవిత & నాగేందర్ · డిసెంబర్ 2026'}</p>
        </header>
        <ol className="itin-list">
          {ROWS.map((r) => (
            <li key={r.id} className="itin-row">
              <div className="itin-date"><span>{en ? 'Dec' : 'డిసెం'}</span><b>{r.date}</b><span>{r.day[lang]}</span></div>
              <div className="itin-text">
                <h3>{r.name[lang]}</h3>
                <p className="itin-time">{r.time[lang]}</p>
                <p>{r.venue}</p>
                <p className="itin-attire">{r.attire[lang]}</p>
              </div>
              <div className={'itin-art' + (r.art.length > 1 ? ' pair' : '')}>{r.art.map((src) => <img key={src} src={src} alt="" loading="lazy" decoding="async" />)}</div>
            </li>
          ))}
        </ol>
        <a className="ev-col-map itin-cal" href={calendar}>{en ? 'Add all events to my calendar' : 'అన్ని వేడుకలను నా క్యాలెండర్‌లో చేర్చండి'}</a>
      </div>
    </section>
  );
}
