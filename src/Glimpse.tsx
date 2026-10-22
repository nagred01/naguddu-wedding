import React from 'react';
import {type Lang} from './i18n';
import itinerary from './img/all-events-supplied.webp';
export function Glimpse({lang}:{lang:Lang}){return <section id="glimpse" data-sec="glimpse" className="sec supplied-itinerary" aria-label={lang==='en'?'All events':'అన్ని వేడుకలు'}><img src={itinerary} loading="lazy" decoding="async" className="supplied-itinerary-image" alt={lang==='en'?'Bhavitha and Nagender wedding itinerary for December 1 to4,2026. Supplied English itinerary image.':'భవిత మరియు నాగేందర్ వివాహ వేడుకల వివరాలు. అందించిన ఆంగ్ల చిత్రంలో వివరాలు ఉన్నాయి.'}/></section>}
