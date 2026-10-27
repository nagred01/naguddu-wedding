import React from 'react';
import {type Lang} from './i18n';
import itinerary from './img/all-events-itinerary.webp';
// All five events as one calendar file: phones and computers offer to add them all to the guest's calendar.
import calendar from './naguddu-wedding.ics';
export function Glimpse({lang}:{lang:Lang}){return <section id="glimpse" data-sec="glimpse" className="sec supplied-itinerary" aria-label={lang==='en'?'All events':'అన్ని వేడుకలు'}><div className="itinerary-frame"><img src={itinerary} loading="lazy" decoding="async" className="supplied-itinerary-image" alt={lang==='en'?'Bhavitha and Nagender wedding itinerary for December 1 to 4, 2026: Haldi, Mehendi, Pellikuthuru / Pellikoduku, Wedding and Cocktail Night.':'భవిత మరియు నాగేందర్ వివాహ వేడుకల వివరాలు. అందించిన ఆంగ్ల చిత్రంలో వివరాలు ఉన్నాయి.'}/><a className="ev-col-map itinerary-cal" href={calendar}>{lang==='en'?'Add all events to my calendar':'అన్ని వేడుకలను నా క్యాలెండర్‌లో చేర్చండి'}</a></div></section>}
