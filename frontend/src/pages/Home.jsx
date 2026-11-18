import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bus, MapPin, Calendar, Clock, ArrowRight, ArrowLeftRight, 
  Search, CheckCircle2, ChevronRight, AlertCircle, RefreshCw,
  Locate, ArrowUpDown, Route as RouteIcon, Info, Heart, X,
  Navigation, Shield, ShieldCheck, Compass, Radio, Check
} from 'lucide-react';
import { stopService, trackingService } from '../api/services';
import LeafletMap from '../components/LeafletMap';
import PhoneLiveLocation from '../components/PhoneLiveLocation';

// Authentic Mangaluru Local City Buses & Landmarks
import panamburImg from '../assets/images/landmarks/panambur-beach.jpg';
import tannirbhaviImg from '../assets/images/landmarks/tannirbhavi-beach.jpg';
import sultanBatteryImg from '../assets/images/landmarks/sultan-battery.jpg';
import kudroliImg from '../assets/images/landmarks/kudroli-temple.jpg';
import kadriImg from '../assets/images/landmarks/kadri-temple.jpg';
import stAloysiusImg from '../assets/images/landmarks/st-aloysius.jpg';
import pilikulaImg from '../assets/images/landmarks/pilikula.jpg';
import netravatiImg from '../assets/images/landmarks/netravati-bridge.jpg';
import busStandImg from '../assets/images/landmarks/mangalore-bus-stand.jpg';

import mgRoadCityBusImg from '../assets/images/buses/mangaluru-city-bus-mg-road.jpg';
import nagaraSarigeImg from '../assets/images/buses/mangaluru-nagara-sarige.jpg';
import cityBusImg1 from '../assets/images/city-bus-1.jpg';
import cityBusImg2 from '../assets/images/city-bus-2.jpg';

// Comprehensive Database Mangaluru City Bus Stops (SQLite Verified)
const MANGALURU_DATABASE_STOPS = [
  {
    id: 1,
    name: 'State Bank',
    displayName: 'State Bank',
    code: 'STBK',
    area: 'Central Bus Terminal Hub (Car Street / Bunder)',
    popular: true,
    aliases: ['statebank', 'car street', 'service bus stand', 'central bus stand', 'port']
  },
  {
    id: 5,
    name: 'Bejai',
    displayName: 'KSRTC Bejai',
    code: 'BEJI',
    area: 'KSRTC Inter-State Terminal & Church',
    popular: true,
    aliases: ['ksrtc', 'ksrtc bejai', 'bejai bus stand', 'bejai ksrtc']
  },
  {
    id: 4,
    name: 'Lalbagh',
    displayName: 'Lalbagh',
    code: 'LALB',
    area: 'Mangaluru City Corporation (MCC) & MG Road',
    popular: true,
    aliases: ['mcc', 'mg road', 'mangala stadium', 'saibeen']
  },
  {
    id: 2,
    name: 'Hampankatta',
    displayName: 'Hampankatta',
    code: 'HMPK',
    area: 'Downtown Commercial Hub (Old Bus Stand / Market)',
    popular: true,
    aliases: ['hampankatta circle', 'central market', 'clock tower', 'old bus stand', 'st aloysius']
  },
  {
    id: 7,
    name: 'Kankanady',
    displayName: 'Kankanady',
    code: 'KNKD',
    area: 'Father Muller Hospital & Market Circle',
    popular: true,
    aliases: ['fr muller', 'father muller', 'kankanady market', 'bypass']
  },
  {
    id: 8,
    name: 'Pumpwell',
    displayName: 'Pumpwell',
    code: 'PUMP',
    area: 'Mahaveera Circle & NH-66 Arterial Gateway',
    popular: true,
    aliases: ['mahaveera circle', 'pumpwell circle', 'flyover']
  },
  {
    id: 42,
    name: 'Jyothi',
    displayName: 'Jyothi',
    code: 'JYOT',
    area: 'Dr. Ambedkar Circle / KMC Hospital',
    popular: true,
    aliases: ['ambedkar circle', 'kmc jyothi', 'light house hill', 'jyoti']
  },
  {
    id: 37,
    name: 'Bunts Hostel',
    displayName: 'Bunts Hostel',
    code: 'BNTH',
    area: 'Kadri Road & Ramakrishna College Junction',
    popular: true,
    aliases: ['bunts hostel circle', 'bunths hostel', 'ramakrishna college']
  },
  {
    id: 6,
    name: 'Kadri',
    displayName: 'Kadri',
    code: 'KADR',
    area: 'Kadri Manjunath Temple & Kadri Park',
    popular: true,
    aliases: ['kadri park', 'kadri temple', 'kadri tollgate', 'manjunatha']
  },
  {
    id: 17,
    name: 'Urwa',
    displayName: 'Urwa Store',
    code: 'URWA',
    area: 'Urwa Stores & Sri Mariyamma Temple Road',
    popular: true,
    aliases: ['urwa store', 'urwa stores', 'marigudi']
  },
  {
    id: 21,
    name: 'Kulur',
    displayName: 'Kulur',
    code: 'KULR',
    area: 'Kulur Ferry & Gurupura River Bridge',
    popular: true,
    aliases: ['kuloor', 'kulur bridge', 'gurupura']
  },
  {
    id: 12,
    name: 'Kottara Chowki',
    displayName: 'Kottara',
    code: 'KTCH',
    area: 'Highway Flyover & NH-66 Coastal Link',
    popular: true,
    aliases: ['kottara', 'kottara chowki', 'kottara flyover']
  },
  {
    id: 13,
    name: 'Surathkal',
    displayName: 'Surathkal',
    code: 'SRTK',
    area: 'NITK Campus, Lighthouse & Suburban Terminal',
    popular: true,
    aliases: ['nitk', 'surathkal beach', 'nitk lighthouse', 'surathkal market']
  },
  {
    id: 10,
    name: 'Ladyhill',
    displayName: 'Ladyhill',
    code: 'LDHL',
    area: 'Urwa Church & St. Aloysius School Circle',
    popular: false,
    aliases: ['lady hill', 'ladyhill circle']
  },
  {
    id: 11,
    name: 'Urwa Market',
    displayName: 'Urwa Market',
    code: 'URWM',
    area: 'Canara College & Residential Market Hub',
    popular: false,
    aliases: ['urwa market', 'canara college']
  },
  {
    id: 14,
    name: 'Ullal',
    displayName: 'Ullal',
    code: 'ULLL',
    area: 'Rani Abbakka Circle, Dargah & Coastal Shore',
    popular: false,
    aliases: ['ullal beach', 'abbakka circle', 'summer sands']
  },
  {
    id: 16,
    name: 'Pilikula',
    displayName: 'Pilikula',
    code: 'PLKL',
    area: 'Nisargadhama Eco Park, Zoo & Heritage Village',
    popular: false,
    aliases: ['pilikula zoo', 'biological park', 'guthu mane']
  },
  {
    id: 3,
    name: 'Mangaluru Central',
    displayName: 'Mangaluru Central',
    code: 'MAQC',
    area: 'Central Railway Station (MAQ) Attavar Gate',
    popular: false,
    aliases: ['central railway station', 'maq', 'attavar']
  },
  {
    id: 9,
    name: 'Mangaluru Junction',
    displayName: 'Mangaluru Junction',
    code: 'MAJN',
    area: 'Junction Railway Station (MAJN) Kankanady East',
    popular: false,
    aliases: ['junction railway station', 'majn']
  },
  {
    id: 20,
    name: 'Panambur',
    displayName: 'Panambur',
    code: 'PNMB',
    area: 'New Mangalore Port & Panambur Beach',
    popular: false,
    aliases: ['panambur beach', 'nmpt port']
  },
  {
    id: 38,
    name: 'PVS Circle',
    displayName: 'PVS Circle',
    code: 'PVSC',
    area: 'Navabharath Circle & Kodialbail Commercial Arterial',
    popular: false,
    aliases: ['pvs', 'navabharath circle']
  },
  {
    id: 41,
    name: 'Bharath Mall',
    displayName: 'Bharath Mall',
    code: 'BHRM',
    area: 'Bejai Main Road & Cinema / Shopping Mall',
    popular: false,
    aliases: ['bharath mall', 'big bazaar']
  },
  {
    id: 36,
    name: 'Mallikatte',
    displayName: 'Mallikatte',
    code: 'MLKT',
    area: 'Kadri Kambla Road & Lions Club Circle',
    popular: false,
    aliases: ['mallikatte circle']
  },
  {
    id: 35,
    name: 'Bendoorwell',
    displayName: 'Bendoorwell',
    code: 'BNDW',
    area: 'St. Theresa School & Balmatta Highway Link',
    popular: false,
    aliases: ['bendoorwell circle', 'balmatta']
  },
  {
    id: 27,
    name: 'Valencia',
    displayName: 'Valencia',
    code: 'VLNC',
    area: 'Valencia Circle & St. Vincent Ferrer Church',
    popular: false,
    aliases: ['valencia church']
  },
  {
    id: 28,
    name: 'Falnir',
    displayName: 'Falnir',
    code: 'FLNR',
    area: 'Mother Teresa Road & Highland Circle',
    popular: false,
    aliases: ['falnir road', 'highland']
  },
  {
    id: 39,
    name: 'Mannagudda',
    displayName: 'Mannagudda',
    code: 'MNGD',
    area: 'Sanghaniketan & Kudroli Temple Entrance',
    popular: false,
    aliases: ['kudroli', 'sanghaniketan']
  },
  {
    id: 40,
    name: 'Kodialbail',
    displayName: 'Kodialbail',
    code: 'KDLB',
    area: "Besant Women's College & Court Road",
    popular: false,
    aliases: ['besant college']
  },
  {
    id: 22,
    name: 'Kavoor',
    displayName: 'Kavoor',
    code: 'KAVR',
    area: 'Kavoor Mahalingeshwara Temple & Lake',
    popular: false,
    aliases: ['kavoor lake']
  },
  {
    id: 24,
    name: 'Derebail',
    displayName: 'Derebail',
    code: 'DRBL',
    area: 'Derebail Church & Konchady Commercial Strip',
    popular: false,
    aliases: ['konchady']
  },
  {
    id: 25,
    name: 'Bondel',
    displayName: 'Bondel',
    code: 'BNDL',
    area: 'MITE / St. Joseph Engineering Airport Bypass',
    popular: false,
    aliases: ['bondel church']
  },
  {
    id: 26,
    name: 'Vamanjoor',
    displayName: 'Vamanjoor',
    code: 'VMNJ',
    area: 'St. Joseph Engineering College & Moodbidri Highway',
    popular: false,
    aliases: ['vamanjoor junction']
  },
  {
    id: 31,
    name: 'Thokkottu',
    displayName: 'Thokkottu',
    code: 'TKKT',
    area: 'Thokkottu Flyover & Overbridge Gate',
    popular: false,
    aliases: ['thokkottu overbridge']
  },
  {
    id: 32,
    name: 'Deralakatte',
    displayName: 'Deralakatte',
    code: 'DRLK',
    area: 'Yenepoya & KS Hegde Nitte Medical University Hub',
    popular: false,
    aliases: ['yenepoya', 'ks hegde', 'nitte']
  },
  {
    id: 19,
    name: 'Baikampady',
    displayName: 'Baikampady',
    code: 'BKMP',
    area: 'KIADB Industrial Estate & APMC Yard',
    popular: false,
    aliases: ['kiadb', 'baikampady industrial']
  },
  {
    id: 29,
    name: 'Attavar',
    displayName: 'Attavar',
    code: 'ATVR',
    area: 'KMC Hospital Attavar & Central Station South',
    popular: false,
    aliases: ['kmc attavar']
  }
];

// Helper to filter stops based on search term
const filterBusStops = (query) => {
  if (!query || !query.trim()) {
    return [...MANGALURU_DATABASE_STOPS].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
  }

  const clean = query.trim().toLowerCase();
  
  const matches = MANGALURU_DATABASE_STOPS.filter((stop) => {
    const nameMatch = stop.name.toLowerCase().includes(clean);
    const displayMatch = stop.displayName.toLowerCase().includes(clean);
    const codeMatch = stop.code.toLowerCase().includes(clean);
    const areaMatch = stop.area.toLowerCase().includes(clean);
    const aliasMatch = (stop.aliases || []).some(alias => alias.toLowerCase().includes(clean));
    return nameMatch || displayMatch || codeMatch || areaMatch || aliasMatch;
  });

  return matches.sort((a, b) => {
    const aStarts = a.displayName.toLowerCase().startsWith(clean) || a.name.toLowerCase().startsWith(clean);
    const bStarts = b.displayName.toLowerCase().startsWith(clean) || b.name.toLowerCase().startsWith(clean);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aCodeStarts = a.code.toLowerCase().startsWith(clean);
    const bCodeStarts = b.code.toLowerCase().startsWith(clean);
    if (aCodeStarts && !bCodeStarts) return -1;
    if (!aCodeStarts && bCodeStarts) return 1;

    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return 0;
  });
};

// Helper to find matching stop when submitted directly
const findMatchingStop = (query) => {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toLowerCase();
  
  let found = MANGALURU_DATABASE_STOPS.find(
    s => s.displayName.toLowerCase() === clean || s.name.toLowerCase() === clean
  );
  if (found) return found;

  found = MANGALURU_DATABASE_STOPS.find(s => s.code.toLowerCase() === clean);
  if (found) return found;

  found = MANGALURU_DATABASE_STOPS.find(s => (s.aliases || []).some(a => a.toLowerCase() === clean));
  if (found) return found;

  found = MANGALURU_DATABASE_STOPS.find(
    s => s.displayName.toLowerCase().startsWith(clean) || s.name.toLowerCase().startsWith(clean)
  );
  if (found) return found;

  found = MANGALURU_DATABASE_STOPS.find(
    s => s.displayName.toLowerCase().includes(clean) || s.name.toLowerCase().includes(clean)
  );
  return found || null;
};

// Verified Popular Mangaluru Bus Stops for Section 5
const POPULAR_CITY_STOPS_DISPLAY = [
  {
    id: 1,
    name: 'State Bank',
    code: 'STBK',
    category: 'Central Bus Stand Hub',
    description: 'Central transit nerve center connecting all city routes, Car Street, Old Port, and Service Bus Stand.',
    routesCount: '15+ Routes (Route 1A, 15, 27, 42, 19)',
    image: busStandImg,
    keyConnections: ['Surathkal', 'Kadri', 'Ullal', 'Pilikula']
  },
  {
    id: 2,
    name: 'Hampankatta',
    code: 'HMPK',
    category: 'Downtown Commercial Hub',
    description: 'Historic city center near Clock Tower, Old Bus Stand circle, Central Market, and shopping boulevards.',
    routesCount: '12+ Routes (Route 1A, 2, 27, 15)',
    image: stAloysiusImg,
    keyConnections: ['State Bank', 'Lalbagh', 'Pumpwell', 'Surathkal']
  },
  {
    id: 4,
    name: 'Lalbagh',
    code: 'LALB',
    category: 'City Corporation & MG Road',
    description: 'Mangaluru City Corporation (MCC) headquarters, MG Road junction, and Mangala Stadium.',
    routesCount: '10+ Routes (Route 1A, 3, 15, 14)',
    image: mgRoadCityBusImg,
    keyConnections: ['State Bank', 'Ladyhill', 'Kadri', 'Surathkal']
  },
  {
    id: 6,
    name: 'Kadri',
    code: 'KADR',
    category: 'Temple & Residential Hub',
    description: 'Historic 10th-century Kadri Manjunath Temple, Kadri Park, and Mallikatte commercial circle.',
    routesCount: '8+ Routes (Route 15, 19, 27)',
    image: kadriImg,
    keyConnections: ['State Bank', 'Bejai', 'Pilikula', 'Hampankatta']
  },
  {
    id: 7,
    name: 'Kankanady',
    code: 'KNKD',
    category: 'Hospital & Transit Arterial',
    description: 'Father Muller Hospital, Kankanady Market circle, and Pumpwell arterial highway connection.',
    routesCount: '9+ Routes (Route 27, 42, 14, 28)',
    image: cityBusImg2,
    keyConnections: ['State Bank', 'Pumpwell', 'Ullal', 'Mangaluru Junction']
  },
  {
    id: 8,
    name: 'Pumpwell',
    code: 'PUMP',
    category: 'Mahaveera Circle Gateway',
    description: 'Mahaveera Circle flyover interchange linking city buses with southern suburbs and national highway.',
    routesCount: '11+ Routes (Route 27, 42, 44, 9)',
    image: netravatiImg,
    keyConnections: ['State Bank', 'Kankanady', 'Mangaluru Junction', 'Ullal']
  },
  {
    id: 13,
    name: 'Surathkal',
    code: 'SRTK',
    category: 'NITK & Coastal Terminal',
    description: 'NITK campus, Lighthouse Beach, and northern suburban terminal along coastal highway NH-66.',
    routesCount: '6+ Routes (Route 1A, 1B, 2, 45)',
    image: panamburImg,
    keyConnections: ['State Bank', 'Kottara Chowki', 'Lalbagh', 'Panambur']
  },
  {
    id: 17,
    name: 'Urwa Store',
    code: 'URWA',
    category: 'Residential & Market Strip',
    description: 'Urwa Stores, Sri Mariyamma Temple road, and Ladyhill commercial connection.',
    routesCount: '6+ Routes (Route 1A, 3, 11)',
    image: cityBusImg1,
    keyConnections: ['State Bank', 'Kottara', 'Lalbagh', 'Surathkal']
  }
];

// Verified Mangaluru City Bus Routes for Section 6
const VERIFIED_CITY_ROUTES = [
  {
    code: '1A',
    name: 'State Bank ⇄ Surathkal (NITK)',
    via: 'via Hampankatta, Lalbagh, Ladyhill, Urwa Store, Kottara Chowki',
    frequency: 'Every 15 mins (06:30 - 20:30)',
    distance: '18.5 KM',
    scheduledDep: '06:30 AM',
    scheduledArr: '07:20 AM',
    estTravelTime: '50 mins',
    operator: 'DKBOA Mangaluru Private City Bus',
    badgeColor: 'bg-[#0756B8]',
    originId: 1,
    destId: 13
  },
  {
    code: '15',
    name: 'State Bank ⇄ Kadri Park',
    via: 'via Hampankatta, Lalbagh, Bejai Church, Kadri Manjunath Temple',
    frequency: 'Every 20 mins (06:45 - 21:00)',
    distance: '6.8 KM',
    scheduledDep: '06:45 AM',
    scheduledArr: '07:15 AM',
    estTravelTime: '30 mins',
    operator: 'DKBOA Mangaluru Private City Bus',
    badgeColor: 'bg-emerald-600',
    originId: 1,
    destId: 6
  },
  {
    code: '27',
    name: 'State Bank ⇄ Mangaluru Junction',
    via: 'via Hampankatta, Kankanady, Pumpwell (Mahaveera Circle)',
    frequency: 'Every 25 mins (06:15 - 21:00)',
    distance: '7.2 KM',
    scheduledDep: '06:15 AM',
    scheduledArr: '06:50 AM',
    estTravelTime: '35 mins',
    operator: 'DKBOA Mangaluru Private City Bus',
    badgeColor: 'bg-amber-600',
    originId: 1,
    destId: 9
  },
  {
    code: '42',
    name: 'State Bank ⇄ Ullal Beach',
    via: 'via Mangaluru Central, Kankanady, Pumpwell, Netravati Bridge',
    frequency: 'Every 30 mins (06:30 - 21:15)',
    distance: '13.4 KM',
    scheduledDep: '06:30 AM',
    scheduledArr: '07:15 AM',
    estTravelTime: '45 mins',
    operator: 'KSRTC Nagara Sarige',
    badgeColor: 'bg-indigo-600',
    originId: 1,
    destId: 14
  },
  {
    code: '19',
    name: 'State Bank ⇄ Pilikula Nisargadhama',
    via: 'via Hampankatta, Kadri, Vamanjoor Guthu Mane',
    frequency: 'Hourly (08:00 - 18:30)',
    distance: '12.8 KM',
    scheduledDep: '08:00 AM',
    scheduledArr: '08:45 AM',
    estTravelTime: '45 mins',
    operator: 'DKBOA Mangaluru Private City Bus',
    badgeColor: 'bg-rose-600',
    originId: 1,
    destId: 16
  }
];

// Verified Available City Bus Services for Section 7
const AVAILABLE_CITY_SERVICES = [
  {
    id: 1,
    busNumber: 'KA-19-F-1204',
    serviceName: 'Surathkal Cityliner Express',
    routeCode: 'Route 1A',
    operator: 'DKBOA Mangaluru Private City Bus',
    origin: 'State Bank',
    destination: 'Surathkal (NITK)',
    depTime: '08:00 AM',
    arrTime: '08:50 AM',
    duration: '50 mins',
    fare: '₹25.0',
    image: mgRoadCityBusImg,
    badge: 'High Frequency'
  },
  {
    id: 2,
    busNumber: 'KA-19-F-3891',
    serviceName: 'Kadri City Express',
    routeCode: 'Route 15',
    operator: 'DKBOA Mangaluru Private City Bus',
    origin: 'State Bank',
    destination: 'Kadri Park',
    depTime: '08:15 AM',
    arrTime: '08:45 AM',
    duration: '30 mins',
    fare: '₹18.0',
    image: nagaraSarigeImg,
    badge: 'Popular Route'
  },
  {
    id: 3,
    busNumber: 'KA-19-F-5502',
    serviceName: 'Junction Station Connector',
    routeCode: 'Route 27',
    operator: 'DKBOA Mangaluru Private City Bus',
    origin: 'State Bank',
    destination: 'Mangaluru Junction',
    depTime: '08:30 AM',
    arrTime: '09:05 AM',
    duration: '35 mins',
    fare: '₹20.0',
    image: cityBusImg1,
    badge: 'Station Transfer'
  },
  {
    id: 4,
    busNumber: 'KA-19-F-7119',
    serviceName: 'Nagara Sarige Coastal Shuttle',
    routeCode: 'Route 42',
    operator: 'KSRTC Nagara Sarige',
    origin: 'State Bank',
    destination: 'Ullal Beach',
    depTime: '08:30 AM',
    arrTime: '09:15 AM',
    duration: '45 mins',
    fare: '₹22.0',
    image: cityBusImg2,
    badge: 'KSRTC Nagara Sarige'
  }
];

// Authentic Mangaluru Landmarks for Section 10
const MANGALURU_LANDMARKS = [
  {
    name: 'Panambur Beach',
    image: panamburImg,
    category: 'Coastal Port & Beach',
    description: 'Premier coastal destination on NH-66 with coastal sunset views, breakwaters and port activities.',
    routeCode: 'Route 1A / 1B',
    busStop: 'Panambur',
    stopId: 20
  },
  {
    name: 'Tannirbhavi Beach',
    image: tannirbhaviImg,
    category: 'Pine Grove Shore',
    description: 'Golden sandy beach bordered by Casuarina trees and Gurupura river ferry junction.',
    routeCode: 'Route 16 / Ferry',
    busStop: 'Kulur',
    stopId: 21
  },
  {
    name: 'Sultan Battery',
    image: sultanBatteryImg,
    category: '1784 Naval Watchtower',
    description: 'Tipu Sultan’s historic stone fortress overlooking Gurupura River and fishing docks.',
    routeCode: 'Route 16',
    busStop: 'State Bank',
    stopId: 1
  },
  {
    name: 'Kudroli Gokarnath Temple',
    image: kudroliImg,
    category: 'Spiritual Dasara Hub',
    description: 'World-famous Gokarnanatheshwara Temple consecrated by Sri Narayana Guru.',
    routeCode: 'Route 7 / 27',
    busStop: 'State Bank',
    stopId: 1
  },
  {
    name: 'Kadri Manjunath Temple',
    image: kadriImg,
    category: '10th-Century Heritage',
    description: 'Ancient hill temple housing historic bronze Lokeshwara sculptures and Kadri Kambla.',
    routeCode: 'Route 15 / 19',
    busStop: 'Kadri',
    stopId: 6
  },
  {
    name: 'St Aloysius Chapel',
    image: stAloysiusImg,
    category: 'Historic Italian Frescoes',
    description: 'World-renowned church on Lighthouse Hill featuring original Moscheni paintings.',
    routeCode: 'Route 1A / 2 / 27',
    busStop: 'Hampankatta',
    stopId: 2
  },
  {
    name: 'Pilikula Nisargadhama',
    image: pilikulaImg,
    category: 'Eco-Park & Zoo',
    description: '370-acre biological zoo park, lake, Guthu Mane, artisan village and science center.',
    routeCode: 'Route 19',
    busStop: 'Pilikula',
    stopId: 16
  },
  {
    name: 'Netravati River Bridge',
    image: netravatiImg,
    category: 'Scenic Coastal Estuary',
    description: 'Iconic railway and road bridge carrying NH-66 over Netravati river towards Ullal.',
    routeCode: 'Route 42 / 44',
    busStop: 'Pumpwell',
    stopId: 8
  }
];

export default function Home() {
  const navigate = useNavigate();

  // 1. Live Date & Time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedWeekday = currentDateTime.toLocaleDateString('en-IN', { weekday: 'long' });
  const formattedDate = currentDateTime.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  const formattedTime = currentDateTime.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  // 2. City Bus Search States
  const [sourceQuery, setSourceQuery] = useState('State Bank');
  const [selectedSource, setSelectedSource] = useState({ 
    id: 1, 
    name: 'State Bank', 
    displayName: 'State Bank', 
    code: 'STBK' 
  });
  const [sourceOpen, setSourceOpen] = useState(false);

  const [destQuery, setDestQuery] = useState('Surathkal');
  const [selectedDest, setSelectedDest] = useState({ 
    id: 13, 
    name: 'Surathkal', 
    displayName: 'Surathkal', 
    code: 'SRTK' 
  });
  const [destOpen, setDestOpen] = useState(false);

  // Compute filtered stops instantly as user types (0ms latency client-side search)
  const filteredSourceStops = filterBusStops(sourceQuery);
  const filteredDestStops = filterBusStops(destQuery);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [travelDate, setTravelDate] = useState(getTodayStr());
  const [dateOption, setDateOption] = useState('TODAY');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [searchError, setSearchError] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState(null);

  const searchBoxRef = useRef(null);
  const sourceRef = useRef(null);
  const destRef = useRef(null);

  // 3. Live Tracking Preview Data
  const [trackedBuses, setTrackedBuses] = useState([]);

  useEffect(() => {
    async function fetchTrackingPreview() {
      try {
        const res = await trackingService.getBuses();
        setTrackedBuses((res.buses || []).slice(0, 4));
      } catch (err) {
        console.warn('Could not load tracking preview:', err);
      }
    }
    fetchTrackingPreview();
  }, []);

  // Instant filter on input change
  const handleSourceChange = (val) => {
    setSourceQuery(val);
    setSelectedSource(null);
    setSearchError('');
    setSourceOpen(true);
  };

  const handleDestChange = (val) => {
    setDestQuery(val);
    setSelectedDest(null);
    setSearchError('');
    setDestOpen(true);
  };

  // Selection handlers
  const handleSelectSource = (stop) => {
    setSelectedSource({ 
      id: stop.id, 
      name: stop.name, 
      displayName: stop.displayName || stop.name, 
      code: stop.code 
    });
    setSourceQuery(stop.displayName || stop.name);
    setSourceOpen(false);
    setSearchError('');
  };

  const handleSelectDest = (stop) => {
    setSelectedDest({ 
      id: stop.id, 
      name: stop.name, 
      displayName: stop.displayName || stop.name, 
      code: stop.code 
    });
    setDestQuery(stop.displayName || stop.name);
    setDestOpen(false);
    setSearchError('');
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (sourceRef.current && !sourceRef.current.contains(e.target)) setSourceOpen(false);
      if (destRef.current && !destRef.current.contains(e.target)) setDestOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSourceOpen(false);
        setDestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Swap From and To
  const handleSwap = () => {
    const tempQ = sourceQuery;
    const tempS = selectedSource;
    setSourceQuery(destQuery);
    setSelectedSource(selectedDest);
    setDestQuery(tempQ);
    setSelectedDest(tempS);
    setSearchError('');
  };

  // Browser Geolocation for Nearest Stop
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await stopService.getNearby(lat, lng, 3);
          const stopList = res?.nearest_stops || (Array.isArray(res) ? res : []);
          if (stopList && stopList.length > 0) {
            const nearest = stopList[0];
            const matchedDbStop = MANGALURU_DATABASE_STOPS.find(s => s.id === nearest.id || s.name.toLowerCase() === nearest.name.toLowerCase()) || {
              id: nearest.id,
              name: nearest.name,
              displayName: nearest.name,
              code: nearest.code || 'CITY'
            };
            handleSelectSource(matchedDbStop);
            const distLabel = nearest.formatted_distance || `${Math.round((nearest.distance_km || 0) * 1000)} m`;
            const walkLabel = nearest.walking_time_label || '~2 min walk';
            setGeoMessage(`Located nearest stop: ${matchedDbStop.displayName} (${distLabel} away • ${walkLabel})`);
          } else {
            setGeoMessage('No verified Mangaluru city stop within immediate proximity.');
          }
        } catch (e) {
          console.error(e);
          setGeoMessage('Failed to identify nearby bus stop.');
        } finally {
          setGeoLocating(false);
        }
      },
      (err) => {
        setGeoLocating(false);
        if (err.code === 1) {
          setGeoMessage('Location permission denied. Please enable GPS permission in your browser.');
        } else {
          setGeoMessage('Location unavailable or timed out. Please choose from the list.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Journey Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError('');

    if (!sourceQuery.trim()) {
      setSearchError('Please select a boarding city bus stop.');
      return;
    }
    if (!destQuery.trim()) {
      setSearchError('Please select a destination city bus stop.');
      return;
    }
    if (sourceQuery.trim().toLowerCase() === destQuery.trim().toLowerCase()) {
      setSearchError('Departure and destination cannot be the same bus stop.');
      return;
    }

    const sourceStop = selectedSource?.id ? selectedSource : findMatchingStop(sourceQuery);
    const destStop = selectedDest?.id ? selectedDest : findMatchingStop(destQuery);

    const sourceId = sourceStop?.id || 1;
    const destId = destStop?.id || 13;
    const sourceName = sourceStop?.name || sourceQuery;
    const destName = destStop?.name || destQuery;

    navigate('/plan', {
      state: {
        sourceId,
        destId,
        sourceName,
        destName,
        travelDate,
        departureTime: departureTime || '08:00',
        dayOfWeek: new Date(travelDate).toLocaleDateString('en-US', { weekday: 'short' })
      }
    });
  };

  // Pre-fill destination from popular stop card
  const handleSelectPopularStop = (stop) => {
    const matched = MANGALURU_DATABASE_STOPS.find(s => s.id === stop.id) || stop;
    handleSelectDest(matched);
    if (searchBoxRef.current) {
      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Pre-fill route from route card
  const handleSelectRoute = (route) => {
    const originStop = MANGALURU_DATABASE_STOPS.find(s => s.id === route.originId) || { id: 1, name: 'State Bank', displayName: 'State Bank' };
    const destStop = MANGALURU_DATABASE_STOPS.find(s => s.id === route.destId) || { id: route.destId, name: 'Surathkal', displayName: 'Surathkal' };
    handleSelectSource(originStop);
    handleSelectDest(destStop);
    if (searchBoxRef.current) {
      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-[#F4F7FB] text-slate-800 min-h-screen selection:bg-[#0756B8] selection:text-white">
      
      {/* ============================================================ */}
      {/* 1. TOP LIVE DATE & TRANSIT STATUS BAR                        */}
      {/* ============================================================ */}
      <div className="bg-[#102B4E] border-b border-white/10 text-white py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>{formattedWeekday}, {formattedDate}</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="flex items-center gap-1.5 font-mono text-blue-300 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime} IST</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Mangaluru City Bus Network Active
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">DKBOA & Nagara Sarige</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. HERO SECTION: CLEAN TWO-COLUMN LAYOUT                     */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-slate-200 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT SIDE: HEADING & ACTIONS */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F1FF] text-[#0756B8] border border-blue-200 text-xs font-bold uppercase tracking-wider">
                <Bus className="w-3.5 h-3.5" />
                <span>Mangaluru City Bus Transit</span>
              </div>

              {/* Main Heading (Requirement 3) */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102B4E] tracking-tight leading-[1.15]">
                Travel Smart Across <br className="hidden sm:inline" />
                <span className="text-[#0756B8]">
                  Mangaluru
                </span>
              </h1>

              {/* Description (Requirement 3) */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed mx-auto lg:mx-0">
                Find city buses, discover local routes and plan your journey across Mangaluru with ease.
              </p>

              {/* Action Buttons (Requirement 3) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
                <button
                  onClick={() => {
                    if (searchBoxRef.current) {
                      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0756B8] hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Plan Your Journey</span>
                </button>

                <Link
                  to="/routes"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#0756B8] font-bold text-sm border-2 border-[#0756B8] transition-all flex items-center justify-center gap-2"
                >
                  <RouteIcon className="w-4 h-4 text-[#0756B8]" />
                  <span>Explore Bus Routes</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0756B8]" />
                  45+ Verified City Stops
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0756B8]" />
                  15+ Local City Routes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0756B8]" />
                  Direct & 1-Transfer Options
                </span>
              </div>

            </div>

            {/* RIGHT SIDE: AUTHENTIC MANGALURU CITY BUS PHOTOGRAPH */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100 group">
                <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                  <img
                    src={mgRoadCityBusImg}
                    alt="Authentic Mangaluru City Route Bus operating on MG Road"
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102B4E]/80 via-transparent to-transparent pointer-events-none" />

                  {/* Route Badge Overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-[#0756B8] text-white text-xs font-bold shadow-md">
                    Route 1A • Mangaluru City Bus
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="font-mono text-xs text-blue-200 font-semibold block">KA-19-F-1204 • DKBOA Private Bus</span>
                    <h3 className="text-base sm:text-lg font-bold">State Bank ⇄ Surathkal (NITK) via MG Road</h3>
                  </div>
                </div>

                <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Frequency: <strong className="text-slate-900">Every 15 Mins</strong></span>
                  <span>Estimated Time: <strong className="text-slate-900">50 mins</strong></span>
                  <span>Fare: <strong className="text-[#0756B8]">₹25.0</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. JOURNEY SEARCH CARD                                       */}
      {/* ============================================================ */}
      <section ref={searchBoxRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-8">
          
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-[#0756B8] uppercase tracking-wider block">
                Mangaluru City Transit
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#102B4E]">
                Plan Your City Bus Journey
              </h2>
            </div>

            {/* Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={geoLocating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#E8F1FF] hover:bg-blue-100 text-[#0756B8] border border-blue-200 transition-colors"
            >
              <Locate className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Locating Stop...' : 'Use My Current Location'}</span>
            </button>
          </div>

          {/* Geolocation Notice */}
          {geoMessage && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-[#102B4E] rounded-xl text-xs flex items-center justify-between font-medium animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0756B8] flex-shrink-0" />
                {geoMessage}
              </span>
              <button onClick={() => setGeoMessage(null)} className="text-[#0756B8] font-bold hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* FROM Bus Stop */}
              <div className="md:col-span-4 relative" ref={sourceRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    From Bus Stop
                  </label>
                  {selectedSource && (
                    <span className="text-[10px] font-mono font-bold text-[#0756B8] bg-[#E8F1FF] px-2 py-0.5 rounded border border-blue-200">
                      Code: {selectedSource.code}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0756B8]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={sourceQuery}
                    onChange={(e) => handleSourceChange(e.target.value)}
                    onClick={() => setSourceOpen(true)}
                    onFocus={() => setSourceOpen(true)}
                    placeholder="Boarding stop (e.g. State Bank)"
                    className="w-full pl-11 pr-9 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0756B8] focus:border-transparent transition-all placeholder:text-slate-400 cursor-pointer"
                  />
                  {sourceQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSourceQuery('');
                        setSelectedSource(null);
                        setSourceOpen(true);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      title="Clear stop"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {sourceOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 max-h-72 overflow-y-auto animate-fadeIn">
                    <div className="px-3.5 py-1.5 mb-1.5 mx-2 text-[10px] font-bold uppercase tracking-wider text-[#0756B8] bg-[#E8F1FF] rounded-lg flex items-center justify-between">
                      <span>{sourceQuery.trim() ? 'Matching City Stops' : 'Popular Mangaluru Stops'}</span>
                      <span className="text-[9px] text-slate-500 font-semibold">{filteredSourceStops.length} Available</span>
                    </div>

                    {filteredSourceStops.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {filteredSourceStops.map((stop) => {
                          const isSelected = selectedSource?.id === stop.id;
                          return (
                            <div
                              key={stop.id}
                              onClick={() => handleSelectSource(stop)}
                              className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors group ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isSelected 
                                    ? 'bg-[#0756B8] text-white' 
                                    : stop.popular
                                    ? 'bg-[#E8F1FF] text-[#0756B8] group-hover:bg-[#0756B8] group-hover:text-white'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-[#0756B8] group-hover:text-white'
                                }`}>
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-slate-900 group-hover:text-[#0756B8] truncate">
                                      {stop.displayName}
                                    </span>
                                    {stop.popular && (
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 flex-shrink-0">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {stop.area}
                                  </p>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-600">
                                {stop.code}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-800">No bus stops found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Try: State Bank, Bejai, Hampankatta, Surathkal</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SWAP BUTTON */}
              <div className="md:col-span-1 flex justify-center -my-2 md:my-0 pb-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-xl bg-[#E8F1FF] hover:bg-blue-100 text-[#0756B8] border border-blue-200 flex items-center justify-center transition-all transform hover:rotate-180 shadow-sm"
                  title="Swap Boarding and Destination Stops"
                >
                  <ArrowUpDown className="w-4 h-4 md:hidden" />
                  <ArrowLeftRight className="w-4 h-4 hidden md:block" />
                </button>
              </div>

              {/* TO Bus Stop */}
              <div className="md:col-span-4 relative" ref={destRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    To Bus Stop
                  </label>
                  {selectedDest && (
                    <span className="text-[10px] font-mono font-bold text-[#0756B8] bg-[#E8F1FF] px-2 py-0.5 rounded border border-blue-200">
                      Code: {selectedDest.code}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={destQuery}
                    onChange={(e) => handleDestChange(e.target.value)}
                    onClick={() => setDestOpen(true)}
                    onFocus={() => setDestOpen(true)}
                    placeholder="Destination stop (e.g. Surathkal)"
                    className="w-full pl-11 pr-9 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0756B8] focus:border-transparent transition-all placeholder:text-slate-400 cursor-pointer"
                  />
                  {destQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDestQuery('');
                        setSelectedDest(null);
                        setDestOpen(true);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      title="Clear stop"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {destOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 max-h-72 overflow-y-auto animate-fadeIn">
                    <div className="px-3.5 py-1.5 mb-1.5 mx-2 text-[10px] font-bold uppercase tracking-wider text-[#0756B8] bg-[#E8F1FF] rounded-lg flex items-center justify-between">
                      <span>{destQuery.trim() ? 'Matching City Stops' : 'Popular Mangaluru Stops'}</span>
                      <span className="text-[9px] text-slate-500 font-semibold">{filteredDestStops.length} Available</span>
                    </div>

                    {filteredDestStops.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {filteredDestStops.map((stop) => {
                          const isSelected = selectedDest?.id === stop.id;
                          return (
                            <div
                              key={stop.id}
                              onClick={() => handleSelectDest(stop)}
                              className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors group ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isSelected 
                                    ? 'bg-[#0756B8] text-white' 
                                    : stop.popular
                                    ? 'bg-[#E8F1FF] text-[#0756B8] group-hover:bg-[#0756B8] group-hover:text-white'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-[#0756B8] group-hover:text-white'
                                }`}>
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-slate-900 group-hover:text-[#0756B8] truncate">
                                      {stop.displayName}
                                    </span>
                                    {stop.popular && (
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 flex-shrink-0">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {stop.area}
                                  </p>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-600">
                                {stop.code}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-800">No bus stops found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Try: Surathkal, Kadri, Ullal, Pumpwell</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DATE & TIME (Combined Column) */}
              <div className="md:col-span-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Travel Date
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => {
                        setTravelDate(e.target.value);
                        setDateOption('CUSTOM');
                      }}
                      className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0756B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Departure Time
                    </label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0756B8]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Error Banner */}
            {searchError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Bottom Row: Quick Date selection & Blue Find My Bus Button */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-bold uppercase mr-1">
                  Quick Date:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDateOption('TODAY');
                    setTravelDate(getTodayStr());
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    dateOption === 'TODAY'
                      ? 'bg-[#0756B8] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateOption('TOMORROW');
                    setTravelDate(getTomorrowStr());
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    dateOption === 'TOMORROW'
                      ? 'bg-[#0756B8] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Tomorrow
                </button>
              </div>

              {/* Blue Find My Bus Button (Requirement 4) */}
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0756B8] hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Bus className="w-4 h-4" />
                <span>Find My Bus</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

          </form>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. POPULAR CITY BUS STOPS (Section 5)                        */}
      {/* ============================================================ */}
      <section id="popular-stops" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0756B8] uppercase tracking-wider block mb-1">
            Transit Hubs & Terminals
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#102B4E] tracking-tight">
            Popular Bus Stops in Mangaluru
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Verified boarding locations, major city interchanges and coastal terminals across Mangaluru city.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_CITY_STOPS_DISPLAY.map((stop) => (
            <div
              key={stop.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={stop.image}
                    alt={stop.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#102B4E]/90 text-white text-[10px] font-bold">
                    STOP CODE: {stop.code}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-medium text-slate-300 block">{stop.category}</span>
                    <h3 className="text-base font-bold">{stop.name}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stop.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {stop.keyConnections.map((dest, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        ➔ {dest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* View Routes Button (Requirement 5) */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleSelectPopularStop(stop)}
                  className="w-full py-2.5 rounded-xl bg-[#E8F1FF] hover:bg-[#0756B8] text-[#0756B8] hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Routes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. EXPLORE MANGALURU CITY BUS ROUTES (Section 6)             */}
      {/* ============================================================ */}
      <section id="city-routes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0756B8] uppercase tracking-wider block mb-1">
            Verified City Network
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#102B4E] tracking-tight">
            Explore Mangaluru City Bus Routes
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            High-frequency passenger routes connecting commercial markets, hospitals, colleges and coastal areas.
          </p>
        </div>

        {/* Route Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {VERIFIED_CITY_ROUTES.map((route) => (
            <div
              key={route.code}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-lg text-white font-black text-xs ${route.badgeColor}`}>
                    Route {route.code}
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                    {route.frequency}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {route.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {route.via}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance:</span>
                    <strong className="text-slate-900">{route.distance}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Departure:</span>
                    <strong className="text-slate-900">{route.scheduledDep}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Travel Time:</span>
                    <strong className="text-emerald-700">{route.estTravelTime}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400">Operator:</span>
                    <span className="text-slate-700 font-medium">{route.operator}</span>
                  </div>
                </div>
              </div>

              {/* View Route Action */}
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => handleSelectRoute(route)}
                  className="w-full py-2.5 rounded-xl bg-[#0756B8] hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Route</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Phone Live Location and Interactive City Transit Map */}
        <div id="live-location" className="mt-10">
          <PhoneLiveLocation 
            title="Phone Live Location & Nearby City Bus Stops"
            onPlanFromStop={(stop) => {
              const matchedDbStop = MANGALURU_DATABASE_STOPS.find(
                s => s.id === stop.id || s.name.toLowerCase() === stop.name.toLowerCase()
              ) || {
                id: stop.id,
                name: stop.name,
                displayName: stop.name,
                code: stop.code || 'CITY'
              };
              handleSelectSource(matchedDbStop);
              searchBoxRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>

      </section>

      {/* ============================================================ */}
      {/* 6. AVAILABLE CITY BUS SERVICES (Section 7)                   */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0756B8] uppercase tracking-wider block mb-1">
            Transit Fleet Roster
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#102B4E] tracking-tight">
            Available City Bus Services
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Verified local private city buses (DKBOA) and KSRTC Nagara Sarige running on published schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AVAILABLE_CITY_SERVICES.map((bus) => (
            <div
              key={bus.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={bus.image}
                    alt={bus.serviceName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#0756B8] text-white text-[10px] font-bold">
                    {bus.routeCode}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="font-mono text-[10px] text-blue-200 block">{bus.busNumber}</span>
                    <h3 className="text-sm font-bold truncate">{bus.serviceName}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="text-xs text-slate-500 font-medium">
                    {bus.operator}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Departure:</span>
                      <strong className="text-slate-900">{bus.depTime} ({bus.origin})</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Estimated Arrival:</span>
                      <strong className="text-slate-900">{bus.arrTime} ({bus.destination})</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <strong className="text-slate-900">{bus.duration}</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Fare:</span>
                      <span className="text-[#0756B8] font-bold">{bus.fare}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Journey Button (Requirement 7) */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    setSourceQuery(bus.origin);
                    setSelectedSource(null);
                    setDestQuery(bus.destination);
                    setSelectedDest(null);
                    if (searchBoxRef.current) {
                      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#0756B8] hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Journey</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. DIRECT AND TRANSFER JOURNEYS (Section 8)                  */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0756B8] uppercase tracking-wider block mb-1">
            Intelligent City Transit Logic
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#102B4E] tracking-tight">
            Direct & One-Transfer Journeys
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Never miss a connection. Our planner pairs direct routes or optimal 1-transfer connections across State Bank and Hampankatta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Direct Option Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Direct Connection
              </span>
              <span className="text-xs text-slate-500 font-semibold">Zero Transfers</span>
            </div>

            <h3 className="text-lg font-bold text-[#102B4E]">
              Direct City Route (Point-to-Point)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Board a single bus from your origin to destination without changing vehicles. High frequency on major corridors like Route 1A (State Bank ⇄ Surathkal) and Route 15 (State Bank ⇄ Kadri).
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
              <span>Average Wait Time: <strong>5 – 15 mins</strong></span>
              <span>Fastest Journey</span>
            </div>
          </div>

          {/* Transfer Option Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                1-Transfer Connection
              </span>
              <span className="text-xs text-slate-500 font-semibold">Via State Bank / Hampankatta</span>
            </div>

            <h3 className="text-lg font-bold text-[#102B4E]">
              Single Transfer via Transit Interchange
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When no direct route is active, our journey planner automatically computes a 1-transfer route with verified transfer wait windows (5 to 120 mins) at State Bank or Hampankatta.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
              <span>Transfer Window: <strong>5 – 25 mins</strong></span>
              <span>Verified Interchange</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. LIVE BUS TRACKING (Section 9)                             */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="bg-[#102B4E] rounded-2xl p-6 sm:p-10 text-white shadow-lg">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0756B8] text-white text-xs font-bold mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Simulated Transit Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Track Your City Bus
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                Last known stop arrival status and timetable progress across key Mangaluru routes.
              </p>
            </div>

            <Link
              to="/tracking"
              className="px-5 py-2.5 rounded-xl bg-[#0756B8] hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>View Full Radar</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trackedBuses.map((bus) => (
              <div
                key={bus.id}
                className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-300">{bus.vehicle_id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold">
                    {bus.route_code}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white truncate">{bus.vehicle_name}</h4>
                  <p className="text-[11px] text-blue-200 truncate">{bus.operator}</p>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Approaching:</span>
                    <strong className="text-emerald-300">{bus.next_stop_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">ETA / Speed:</span>
                    <span className="font-mono">~{bus.eta_minutes}m • {bus.speed} km/h</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-amber-300 pt-1 font-semibold uppercase">
                    <span>Data Status:</span>
                    <span>{bus.is_demo ? 'DEMO Simulation' : 'Live GPS'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-blue-200/80">
            Timetable-based estimates reflect scheduled service headways. Live GPS updates depend on active vehicle transponders.
          </p>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. AUTHENTIC MANGALURU LANDMARKS (Section 10)                 */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0756B8] uppercase tracking-wider block mb-1">
            Coastal Karnataka Destinations
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#102B4E] tracking-tight">
            Explore Mangaluru By City Bus
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Reach every famous beach, historic temple, and educational institution directly by public transit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MANGALURU_LANDMARKS.map((landmark, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={landmark.image}
                    alt={landmark.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#102B4E]/80 text-white text-[10px] font-bold">
                    {landmark.category}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-bold">{landmark.name}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {landmark.description}
                  </p>
                  <div className="text-[11px] font-semibold text-[#0756B8] bg-[#E8F1FF] px-2.5 py-1 rounded-lg inline-block">
                    Nearest: {landmark.busStop} ({landmark.routeCode})
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    const matched = MANGALURU_DATABASE_STOPS.find(s => s.id === landmark.stopId) || { id: landmark.stopId, name: landmark.busStop };
                    handleSelectDest(matched);
                    if (searchBoxRef.current) {
                      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-[#E8F1FF] hover:bg-[#0756B8] text-[#0756B8] hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <span>Find Buses</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  );
}