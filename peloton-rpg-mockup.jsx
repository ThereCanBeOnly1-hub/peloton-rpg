import React, { useState } from 'react';
import { Check, Footprints, User, Map, X, ExternalLink, RefreshCw } from 'lucide-react';

const COLORS = {
  bg: '#16120D', stone: '#241D15', parchment: '#D6C18C', parchmentDim: '#A68F5E',
  iron: '#2B2620', bronze: '#6B4F2E', gold: '#D9A441', moss: '#4F6B4A',
  crimson: '#7A2E2E', ink: '#14110C',
};
const FONT_DISPLAY = "'Uncial Antiqua','Cinzel',Georgia,serif";
const FONT_HEADING = "'Cinzel',Georgia,serif";
const FONT_BODY = "'IM Fell English',Georgia,serif";
const FONT_MONO = "ui-monospace,'SF Mono',Menlo,monospace";

function SwordIcon({ size = 24, color = '#000' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L13.4 14.2 L10.8 14 Z"/><line x1="12" y1="14" x2="12.2" y2="20.3"/><line x1="8.6" y1="15.4" x2="15.6" y2="15.1"/><path d="M10.7 19.8 Q12 22.2 13.4 19.9"/></svg>;
}
function WheelIcon({ size = 24, color = '#000' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="1.3" fill={color} stroke="none"/><line x1="12" y1="12" x2="11.8" y2="3.9"/><line x1="12" y1="12" x2="18.3" y2="8.1"/><line x1="12" y1="12" x2="18.1" y2="15.9"/><line x1="12" y1="12" x2="12.2" y2="20.1"/><line x1="12" y1="12" x2="5.8" y2="15.7"/><line x1="12" y1="12" x2="5.9" y2="8.2"/></svg>;
}
function SprigIcon({ size = 24, color = '#000' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21 C12.3 14 11.8 8 12 3"/><path d="M12 16.2 C9.4 15.1 8 13 7.5 10.4"/><path d="M12.1 12.4 C14.6 11.4 16 9.4 16.2 6.9"/><path d="M11.9 8.6 C9.9 7.8 9 6.3 8.7 4.5"/></svg>;
}
function TorchIcon({ size = 24, color = '#000' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21 L12.1 13.4"/><path d="M9.2 13.4 Q8.9 10.8 12 6.3 Q15.1 10.9 14.7 13.5 Z"/><path d="M10.3 12.9 Q10.6 11.3 12.1 8.7"/></svg>;
}
function CrestIcon({ size = 24, color = '#000' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8 L6.4 5.4 L9 9.1 L12 4.4 L15 9.1 L17.6 5.4 L20 8 L18.4 15.2 Q12 17.6 5.6 15.2 Z"/></svg>;
}

const INSTRUCTORS = ['Robin Arzon', 'Cody Rigsby', 'Ally Love', 'Olivia Amato', 'Matt Wilpers'];
const STRENGTH_FOCUS = ['Upper Body', 'Lower Body', 'Core', 'Full Body'];

const TITLE_POOL = {
  strength: ['Forge the Blade','Storm the Keep','Hold the Line','Arm the Garrison'],
  cycle: ['Race the Caravan','Outrun the Storm','Scout the Pass'],
  rest: ['Rest at Camp','Mend Your Wounds','Tend the Fire'],
};
const SUB_LABEL = { strength: 'Strength', cycle: 'Light Cycle', rest: 'Rest Day' };
const ICONS = { strength: SwordIcon, cycle: WheelIcon, rest: TorchIcon };
const TYPE_META = { strength: { label: 'Strength', letter: 'S' }, cycle: { label: 'Cycle', letter: 'C' }, rest: { label: 'Rest', letter: 'R' } };

// Mock class data keyed by type+focus
const CLASS_POOL = {
  'strength-Upper Body': [
    { name: '10-Min Upper Body Strength', instructor: 'Robin Arzon', duration: 10 },
    { name: '20-Min Upper Body Strength', instructor: 'Ally Love', duration: 20 },
    { name: '15-Min Upper Body Bootcamp', instructor: 'Cody Rigsby', duration: 15 },
  ],
  'strength-Lower Body': [
    { name: '20-Min Lower Body Strength', instructor: 'Matt Wilpers', duration: 20 },
    { name: '10-Min Glutes & Legs', instructor: 'Olivia Amato', duration: 10 },
    { name: '15-Min Lower Body Focus', instructor: 'Robin Arzon', duration: 15 },
  ],
  'strength-Core': [
    { name: '10-Min Core Strength', instructor: 'Cody Rigsby', duration: 10 },
    { name: '15-Min Abs & Core', instructor: 'Ally Love', duration: 15 },
    { name: '20-Min Core Strength', instructor: 'Matt Wilpers', duration: 20 },
  ],
  'strength-Full Body': [
    { name: '20-Min Full Body Strength', instructor: 'Olivia Amato', duration: 20 },
    { name: '15-Min Full Body Bootcamp', instructor: 'Robin Arzon', duration: 15 },
  ],
  'cycle': [
    { name: '20-Min Pop Ride', instructor: 'Cody Rigsby', duration: 20 },
    { name: '15-Min Low Impact Ride', instructor: 'Ally Love', duration: 15 },
    { name: '20-Min Endurance Ride', instructor: 'Matt Wilpers', duration: 20 },
  ],
  'rest': [{ name: null, instructor: null, duration: 0 }],
};

function pickClass(type, focus) {
  const key = type === 'cycle' ? 'cycle' : type === 'rest' ? 'rest' : `strength-${focus || 'Full Body'}`;
  const pool = CLASS_POOL[key] || CLASS_POOL['strength-Full Body'];
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

function makeSchedule() {
  const focuses = ['Upper Body', null, null, null, 'Lower Body', 'Core', null];
  const types = ['strength', 'rest', 'cycle', 'rest', 'strength', 'strength', 'rest'];
  const statuses = ['done', 'done', 'today', 'upcoming', 'upcoming', 'upcoming', 'upcoming'];
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  return days.map((day, i) => {
    const type = types[i], focus = focuses[i];
    const cls = pickClass(type, focus);
    return { day, type, focus, status: statuses[i], ...cls };
  });
}

const INITIAL_SCHEDULE = makeSchedule();
const POS = [
  { x: 110, y: 90 }, { x: 290, y: 230 }, { x: 110, y: 370 }, { x: 290, y: 510 },
  { x: 110, y: 650 }, { x: 290, y: 790 }, { x: 110, y: 930 },
];
const TILTS = [-4, 3, -3, 5, -2, 4, -5];

function buildPath(points) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1], p1 = points[i], midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(8,6,4,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,zIndex:50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:COLORS.parchment,color:COLORS.ink,border:`3px double ${COLORS.bronze}`,borderRadius:6,maxWidth:wide?420:360,width:'100%',padding:'20px 18px',boxShadow:'0 16px 50px rgba(0,0,0,0.65)',position:'relative',fontFamily:FONT_BODY,maxHeight:'90vh',overflowY:'auto' }}>
        <button onClick={onClose} aria-label="Close" style={{ position:'absolute',top:10,right:10,background:'none',border:'none',cursor:'pointer',color:COLORS.bronze,padding:4 }}><X size={18}/></button>
        <div style={{ fontFamily:FONT_HEADING,fontSize:11,letterSpacing:'0.15em',color:COLORS.bronze }} className="uppercase mb-1">{title}</div>
        {children}
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange, min=0, max=99 }) {
  const btn = { width:22,height:22,borderRadius:4,border:`1px solid ${COLORS.bronze}`,background:'transparent',color:COLORS.bronze,fontSize:14,cursor:'pointer' };
  return (
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${COLORS.bronze}55` }}>
      <span style={{ fontSize:13 }}>{label}</span>
      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
        <button onClick={() => onChange(Math.max(min,value-1))} style={btn}>&minus;</button>
        <span style={{ fontFamily:FONT_MONO,fontSize:13,width:18,textAlign:'center' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max,value+1))} style={btn}>+</button>
      </div>
    </div>
  );
}

// Per-day re-roll modal
function RerollModal({ day, onClose, onConfirm }) {
  const [type, setType] = useState(day.type === 'rest' ? 'rest' : day.type);
  const [focus, setFocus] = useState(day.focus || 'Full Body');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState(day.duration || 20);

  return (
    <Modal title={`Re-roll ${day.day}`} onClose={onClose}>
      <h2 style={{ fontFamily:FONT_HEADING,fontSize:16,margin:'4px 0 10px' }}>Find a Different Class</h2>

      <div style={{ marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${COLORS.bronze}55` }}>
        <div style={{ fontSize:12,color:COLORS.bronze,fontFamily:FONT_MONO,marginBottom:6 }}>Class Type</div>
        <div style={{ display:'flex',gap:6 }}>
          {Object.entries(TYPE_META).map(([key,meta]) => (
            <button key={key} onClick={() => setType(key)} style={{ flex:1,padding:'6px 0',fontFamily:FONT_MONO,fontSize:12,border:`1px solid ${COLORS.bronze}`,borderRadius:4,cursor:'pointer',background:type===key?COLORS.crimson:'transparent',color:type===key?COLORS.parchment:COLORS.ink }}>
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {type === 'strength' && (
        <div style={{ marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${COLORS.bronze}55` }}>
          <div style={{ fontSize:12,color:COLORS.bronze,fontFamily:FONT_MONO,marginBottom:6 }}>Focus Area</div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
            {STRENGTH_FOCUS.map((f) => (
              <button key={f} onClick={() => setFocus(f)} style={{ padding:'5px 9px',fontFamily:FONT_MONO,fontSize:11,border:`1px solid ${COLORS.bronze}`,borderRadius:12,cursor:'pointer',background:focus===f?COLORS.crimson:'transparent',color:focus===f?COLORS.parchment:COLORS.ink }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {type !== 'rest' && (
        <>
          <div style={{ marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${COLORS.bronze}55` }}>
            <div style={{ fontSize:12,color:COLORS.bronze,fontFamily:FONT_MONO,marginBottom:6 }}>Instructor <span style={{ opacity:0.6 }}>(optional)</span></div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
              {INSTRUCTORS.map((name) => (
                <button key={name} onClick={() => setInstructor(instructor===name?'':name)} style={{ padding:'5px 9px',fontFamily:FONT_MONO,fontSize:11,border:`1px solid ${COLORS.bronze}`,borderRadius:12,cursor:'pointer',background:instructor===name?COLORS.crimson:'transparent',color:instructor===name?COLORS.parchment:COLORS.ink }}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <Stepper label="Max minutes" value={duration} onChange={setDuration} min={5} max={60} />
        </>
      )}

      <button
        onClick={() => { onConfirm(type, focus, instructor, duration); onClose(); }}
        style={{ width:'100%',marginTop:14,background:COLORS.moss,color:COLORS.parchment,border:'none',padding:10,borderRadius:4,fontFamily:FONT_HEADING,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}
      >
        <RefreshCw size={13}/> Roll New Class
      </button>
    </Modal>
  );
}

export default function QuestBoard() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [showPortrait, setShowPortrait] = useState(false);
  const [rerollDay, setRerollDay] = useState(null);
  const [strengthDays, setStrengthDays] = useState(3);
  const [cycleMinutes, setCycleMinutes] = useState(20);
  const [diffMin, setDiffMin] = useState(4);
  const [diffMax, setDiffMax] = useState(8);
  const [instructors, setInstructors] = useState([]);
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [generated, setGenerated] = useState(false);

  const toggleInstructor = (name) => setInstructors((p) => p.includes(name)?p.filter(n=>n!==name):[...p,name]);

  const updateType = (i, type) => {
    setSchedule((prev) => prev.map((s,idx) => {
      if (idx !== i) return s;
      const cls = pickClass(type, s.focus);
      return { ...s, type, ...cls };
    }));
  };

  const moveDay = (i, dir) => {
    setSchedule((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const { type: aT, focus: aF, name: aN, instructor: aI, duration: aD } = next[i];
      const { type: bT, focus: bF, name: bN, instructor: bI, duration: bD } = next[j];
      next[i] = { ...next[i], type: bT, focus: bF, name: bN, instructor: bI, duration: bD };
      next[j] = { ...next[j], type: aT, focus: aF, name: aN, instructor: aI, duration: aD };
      return next;
    });
  };

  const handleReroll = (idx, type, focus, _instructor, duration) => {
    setSchedule((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      const cls = pickClass(type, focus);
      return { ...s, type, focus, ...cls, duration: Math.min(cls.duration, duration) };
    }));
  };

  const lastStrengthIdx = schedule.reduce((acc, s, idx) => (s.type === 'strength' ? idx : acc), -1);
  const boardDays = schedule.map((s, i) => ({
    ...s,
    title: TITLE_POOL[s.type][i % TITLE_POOL[s.type].length],
    sub: SUB_LABEL[s.type],
    pair: s.type !== 'rest',
    icon: ICONS[s.type],
    boss: i === lastStrengthIdx,
  }));

  const pathD = buildPath(POS);
  const completedCount = schedule.filter(s => s.status === 'done').length;

  return (
    <div style={{ background:COLORS.bg,fontFamily:FONT_BODY,minHeight:'100vh',position:'relative' }} className="w-full flex justify-center px-4 py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Cinzel:wght@500;600;700&family=IM+Fell+English:ital@0;1&display=swap');
        @keyframes bob { 0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-6px);} }
        @keyframes pulseGlow { 0%,100%{filter:drop-shadow(0 0 0px rgba(217,164,65,0));}50%{filter:drop-shadow(0 0 10px rgba(217,164,65,0.6));} }
        @media(prefers-reduced-motion:reduce){.bob,.pulseGlow{animation:none!important;}}
        .day-tile:focus-visible{filter:drop-shadow(0 0 6px rgba(217,164,65,0.7));}
      `}</style>
      <svg style={{ position:'absolute',width:0,height:0 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/></filter>
        <defs>
          <clipPath id="sealBlob" clipPathUnits="objectBoundingBox"><path d="M0.50,0.05 C0.70,0.05 0.90,0.20 0.92,0.45 C0.94,0.68 0.78,0.90 0.52,0.93 C0.28,0.96 0.08,0.78 0.06,0.52 C0.04,0.28 0.22,0.08 0.50,0.05 Z"/></clipPath>
          <clipPath id="shieldBlob" clipPathUnits="objectBoundingBox"><path d="M0.50,0.02 L0.92,0.12 C0.94,0.40 0.90,0.62 0.74,0.80 C0.64,0.90 0.56,0.96 0.50,0.99 C0.44,0.96 0.36,0.90 0.26,0.80 C0.10,0.62 0.06,0.40 0.08,0.12 Z"/></clipPath>
        </defs>
      </svg>
      <div style={{ position:'fixed',inset:0,filter:'url(#grain)',opacity:0.5,mixBlendMode:'overlay',pointerEvents:'none' }}/>

      <div className="w-full" style={{ maxWidth:420,position:'relative' }}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <button onClick={() => setShowPortrait(true)} aria-label="View portrait" style={{ position:'relative',flexShrink:0,background:'none',border:'none',padding:0,cursor:'pointer' }}>
            <div style={{ width:62,height:62,borderRadius:'50%',background:COLORS.stone,border:`3px solid ${COLORS.iron}`,boxShadow:`0 0 0 3px ${COLORS.bronze}`,display:'flex',alignItems:'center',justifyContent:'center' }}><User size={26} color={COLORS.parchmentDim}/></div>
            <div style={{ position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',background:COLORS.gold,color:COLORS.ink,fontFamily:FONT_MONO,fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:8,border:`2px solid ${COLORS.bg}` }}>LV 4</div>
          </button>
          <div className="flex-1 pt-1">
            <div style={{ fontFamily:FONT_HEADING,color:COLORS.gold,letterSpacing:'0.2em',fontSize:10 }} className="uppercase mb-1">Quest Board</div>
            <h1 style={{ fontFamily:FONT_DISPLAY,color:COLORS.parchment,fontWeight:400 }} className="text-3xl">Week Seven</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:COLORS.stone,border:`1px solid ${COLORS.iron}` }}>
                <div className="h-full rounded-full" style={{ width:'62%',background:COLORS.gold }}/>
              </div>
              <div style={{ fontFamily:FONT_MONO,color:COLORS.parchmentDim,fontSize:11 }}>{completedCount}/7</div>
            </div>
          </div>
        </div>

        <button onClick={() => setPlanOpen(true)} className="w-full flex items-center justify-center gap-2 mb-8" style={{ background:COLORS.stone,color:COLORS.parchment,border:`2px solid ${COLORS.bronze}`,borderRadius:4,padding:'11px 14px',fontFamily:FONT_HEADING,fontSize:13,letterSpacing:'0.04em',cursor:'pointer' }}>
          <Map size={15} color={COLORS.gold}/> Plan the Week
        </button>

        {/* Board */}
        <div className="relative" style={{ aspectRatio:'400 / 1000' }}>
          <svg viewBox="0 0 400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position:'absolute',inset:0 }}>
            <path d={pathD} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="9" strokeLinecap="round" transform="translate(0,3)"/>
            <path d={pathD} fill="none" stroke={COLORS.bronze} strokeWidth="5" strokeLinecap="round" strokeDasharray="1 16" opacity="0.8"/>
          </svg>
          {boardDays.map((d, i) => {
            const pos = POS[i], left=`${(pos.x/400)*100}%`, top=`${(pos.y/1000)*100}%`;
            const isRest=d.type==='rest', isBoss=!!d.boss, isToday=d.status==='today', isDone=d.status==='done';
            const Icon=d.icon, tilt=TILTS[i];
            const baseSize=isBoss?88:isRest?54:68;
            const tileBg=isBoss?COLORS.crimson:isRest?COLORS.stone:COLORS.parchment;
            const iconColor=isBoss?COLORS.parchment:isRest?COLORS.moss:COLORS.ink;
            const clip=isBoss?'url(#shieldBlob)':'url(#sealBlob)';
            const openDay=()=>setSelectedDay(d);
            return (
              <div key={d.day} style={{ position:'absolute',left,top,transform:'translate(-50%,-50%)',width:100,display:'flex',flexDirection:'column',alignItems:'center' }}>
                <div style={{ position:'relative',width:baseSize,height:baseSize }}>
                  {isToday&&<div className="bob" style={{ position:'absolute',left:'50%',top:-26,transform:'translateX(-50%)',animation:'bob 1.6s ease-in-out infinite' }}><Footprints size={20} color={COLORS.gold}/></div>}
                  {isBoss&&<div style={{ position:'absolute',top:-26,left:'50%',transform:'translateX(-50%)' }}><CrestIcon size={20} color={COLORS.gold}/></div>}
                  <div role="button" tabIndex={0} onClick={openDay} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDay();}}}
                    className={`day-tile${isBoss?' pulseGlow':''}`}
                    style={{ width:baseSize,height:baseSize,clipPath:clip,background:tileBg,border:`3px solid ${isToday?COLORS.gold:COLORS.iron}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',outline:'none',transform:`rotate(${tilt}deg)`,filter:isToday?'drop-shadow(0 0 6px rgba(217,164,65,0.55))':'none',animation:isBoss?'pulseGlow 2.4s ease-in-out infinite':'none',opacity:d.status==='upcoming'?0.88:1 }}>
                    <div style={{ transform:`rotate(${-tilt}deg)` }}><Icon size={isBoss?30:isRest?21:25} color={iconColor}/></div>
                  </div>
                  {d.pair&&<div style={{ position:'absolute',bottom:-2,right:-2,width:22,height:22,borderRadius:'50%',background:COLORS.moss,border:`2px solid ${COLORS.bg}`,display:'flex',alignItems:'center',justifyContent:'center' }}><SprigIcon size={12} color={COLORS.parchment}/></div>}
                  {isDone&&<div style={{ position:'absolute',top:-4,left:-4,width:22,height:22,borderRadius:'50%',background:COLORS.gold,display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${COLORS.bg}` }}><Check size={12} color={COLORS.ink}/></div>}
                </div>
                <div style={{ textAlign:'center',marginTop:9 }}>
                  <div style={{ fontFamily:FONT_MONO,color:COLORS.parchmentDim,fontSize:10,letterSpacing:'0.1em' }}>{d.day}</div>
                  <div style={{ fontFamily:FONT_HEADING,color:COLORS.parchment,fontSize:isBoss?13.5:12,fontWeight:600,lineHeight:1.25,marginTop:2 }}>{d.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-10 flex-wrap" style={{ fontFamily:FONT_MONO,fontSize:10,color:COLORS.parchmentDim }}>
          <div className="flex items-center gap-1"><SwordIcon size={13} color={COLORS.parchmentDim}/> Strength</div>
          <div className="flex items-center gap-1"><WheelIcon size={13} color={COLORS.parchmentDim}/> Cycle</div>
          <div className="flex items-center gap-1"><SprigIcon size={13} color={COLORS.parchmentDim}/> Stretch</div>
          <div className="flex items-center gap-1"><TorchIcon size={13} color={COLORS.parchmentDim}/> Rest</div>
          <div className="flex items-center gap-1"><CrestIcon size={13} color={COLORS.gold}/> Boss</div>
        </div>
      </div>

      {/* Day popup */}
      {selectedDay && (
        <Modal title={selectedDay.day} onClose={() => setSelectedDay(null)}>
          <h2 style={{ fontFamily:FONT_HEADING,fontSize:21,margin:'4px 0 2px' }}>{selectedDay.title}</h2>
          <div style={{ fontFamily:FONT_MONO,fontSize:11,color:COLORS.bronze,marginBottom:12 }}>{selectedDay.sub}{selectedDay.pair?' + Stretch':''}</div>
          {selectedDay.type!=='rest' ? (
            <>
              <div style={{ fontSize:15,lineHeight:1.5,marginBottom:4 }}><em>{selectedDay.name}</em></div>
              <div style={{ fontSize:14,lineHeight:1.5,marginBottom:14 }}>with <strong>{selectedDay.instructor}</strong> &middot; {selectedDay.duration} min</div>
              <a href="#" onClick={(e)=>e.preventDefault()} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:COLORS.crimson,color:COLORS.parchment,padding:'10px 14px',borderRadius:4,fontFamily:FONT_HEADING,fontSize:13,textDecoration:'none' }}>
                <ExternalLink size={14}/> View on Peloton
              </a>
            </>
          ) : (
            <div style={{ fontSize:15,lineHeight:1.5 }}>A day to recover. No quest awaits &mdash; rest your blade.</div>
          )}
        </Modal>
      )}

      {showPortrait && (
        <Modal title="Character Portrait" onClose={() => setShowPortrait(false)}>
          <div style={{ display:'flex',justifyContent:'center',padding:'10px 0 4px' }}>
            <div style={{ width:200,height:200,borderRadius:'50%',background:COLORS.stone,border:`4px solid ${COLORS.iron}`,boxShadow:`0 0 0 4px ${COLORS.bronze}`,display:'flex',alignItems:'center',justifyContent:'center' }}><User size={84} color={COLORS.parchmentDim}/></div>
          </div>
          <p style={{ fontSize:13,textAlign:'center',color:COLORS.bronze,marginTop:10 }}>Upload your own image to replace this portrait.</p>
        </Modal>
      )}

      {/* Plan the Week */}
      {planOpen && (
        <Modal title="Plan the Week" onClose={() => setPlanOpen(false)} wide>
          <p style={{ fontSize:14,lineHeight:1.5,marginBottom:6 }}>Set this week&apos;s criteria, then let the board fill itself.</p>
          <Stepper label="Strength days" value={strengthDays} onChange={setStrengthDays} min={1} max={5}/>
          <Stepper label="Cycle minutes" value={cycleMinutes} onChange={setCycleMinutes} min={5} max={45}/>
          <Stepper label="Difficulty min" value={diffMin} onChange={(v)=>setDiffMin(Math.min(v,diffMax))} min={1} max={10}/>
          <Stepper label="Difficulty max" value={diffMax} onChange={(v)=>setDiffMax(Math.max(v,diffMin))} min={1} max={10}/>
          <div style={{ padding:'10px 0 4px' }}>
            <div style={{ fontSize:13,marginBottom:8 }}>Instructors</div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              {INSTRUCTORS.map((name) => {
                const sel=instructors.includes(name);
                return <button key={name} onClick={()=>toggleInstructor(name)} style={{ fontFamily:FONT_MONO,fontSize:11,padding:'5px 9px',borderRadius:12,border:`1px solid ${COLORS.bronze}`,cursor:'pointer',background:sel?COLORS.crimson:'transparent',color:sel?COLORS.parchment:COLORS.ink }}>{name}</button>;
              })}
            </div>
          </div>
          <button onClick={()=>setGenerated(true)} style={{ width:'100%',marginTop:16,background:COLORS.moss,color:COLORS.parchment,border:'none',padding:'10px',borderRadius:4,fontFamily:FONT_HEADING,fontSize:13,cursor:'pointer' }}>
            Generate Week
          </button>

          {generated && (
            <div style={{ marginTop:18,paddingTop:14,borderTop:`2px double ${COLORS.bronze}` }}>
              <div style={{ fontFamily:FONT_HEADING,fontSize:13,marginBottom:2 }}>This Week</div>
              <div style={{ fontFamily:FONT_MONO,fontSize:10,color:COLORS.bronze,marginBottom:10 }}>swap type &middot; arrows to reorder &middot; ↺ to re-roll a class</div>
              {schedule.map((s, i) => (
                <div key={s.day} style={{ padding:'9px 0',borderBottom:`1px solid ${COLORS.bronze}33` }}>
                  {/* Row 1: day + type buttons + arrows */}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: s.type!=='rest'?5:0 }}>
                    <span style={{ fontFamily:FONT_MONO,fontSize:12,color:COLORS.bronze,fontWeight:700,width:34 }}>{s.day}</span>
                    <div style={{ display:'flex',gap:4 }}>
                      {Object.entries(TYPE_META).map(([key,meta]) => (
                        <button key={key} onClick={()=>updateType(i,key)} title={meta.label} style={{ width:28,height:24,borderRadius:4,fontSize:11,fontFamily:FONT_MONO,cursor:'pointer',border:`1px solid ${COLORS.bronze}`,background:s.type===key?COLORS.crimson:'transparent',color:s.type===key?COLORS.parchment:COLORS.ink }}>{meta.letter}</button>
                      ))}
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
                      <button onClick={()=>moveDay(i,-1)} disabled={i===0} style={{ width:20,height:16,fontSize:10,border:`1px solid ${COLORS.bronze}`,background:'transparent',color:i===0?`${COLORS.bronze}44`:COLORS.bronze,cursor:i===0?'default':'pointer',borderRadius:3 }}>&uarr;</button>
                      <button onClick={()=>moveDay(i,1)} disabled={i===schedule.length-1} style={{ width:20,height:16,fontSize:10,border:`1px solid ${COLORS.bronze}`,background:'transparent',color:i===schedule.length-1?`${COLORS.bronze}44`:COLORS.bronze,cursor:i===schedule.length-1?'default':'pointer',borderRadius:3 }}>&darr;</button>
                    </div>
                  </div>
                  {/* Row 2: class details + re-roll */}
                  {s.type !== 'rest' && (
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingLeft:34 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:11,fontFamily:FONT_MONO,color:COLORS.bronze,lineHeight:1.4 }}>{s.name} &middot; {s.duration} min &middot; {s.instructor}</div>
                      </div>
                      <button
                        onClick={()=>setRerollDay({...s,index:i})}
                        title="Re-roll this class"
                        style={{ flexShrink:0,marginLeft:8,width:28,height:28,border:`1px solid ${COLORS.bronze}`,borderRadius:4,background:'transparent',color:COLORS.bronze,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                      >
                        <RefreshCw size={13}/>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Per-day re-roll */}
      {rerollDay && (
        <RerollModal
          day={rerollDay}
          onClose={()=>setRerollDay(null)}
          onConfirm={(type,focus,instr,dur)=>handleReroll(rerollDay.index,type,focus,instr,dur)}
        />
      )}
    </div>
  );
}
