import React, { useState } from 'react';
import {
  Camera,
  Sun,
  Sunset,
  Moon,
  CloudLightning,
  Plane,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Compass,
  Gauge,
  Sliders,
  Radio,
  Keyboard,
  Info,
} from 'lucide-react';
import {
  CameraPreset,
  FlightPhase,
  InteractiveObjectInfo,
  LightingMode,
} from '../types/cockpit';
import { CockpitSimulation } from '../cockpit/simulation';
import { cockpitAudio } from '../audio/cockpitAudio';

interface CockpitDockProps {
  sim: CockpitSimulation;
  activeHover: InteractiveObjectInfo | null;
  activeSelection: InteractiveObjectInfo | null;
  onSelectCamera: (preset: CameraPreset) => void;
  onSelectLighting: (mode: LightingMode) => void;
  onSelectPhase: (phase: FlightPhase) => void;
}

export const CockpitDock: React.FC<CockpitDockProps> = ({
  sim,
  activeHover,
  activeSelection,
  onSelectCamera,
  onSelectLighting,
  onSelectPhase,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'views' | 'lighting' | 'flight' | 'controls' | 'guide'>('views');
  const [muted, setMuted] = useState(false);
  const s = sim.state;

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    cockpitAudio.setMuted(nextMuted);
  };

  const cameraButtons: { id: CameraPreset; label: string; key: string }[] = [
    { id: 'captain', label: 'Captain Seat', key: '1' },
    { id: 'fo', label: 'First Officer', key: '2' },
    { id: 'mcp', label: 'MCP Autopilot', key: '3' },
    { id: 'pedestal', label: 'Throttles', key: '4' },
    { id: 'overhead', label: 'Overhead Panel', key: '5' },
    { id: 'fmc', label: 'FMC / CDU', key: '6' },
    { id: 'outside', label: 'Outside View', key: '7' },
  ];

  const lightingModes: { id: LightingMode; label: string; icon: React.ReactNode }[] = [
    { id: 'day', label: 'Daylight', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'sunset', label: 'Sunset Glow', icon: <Sunset className="w-3.5 h-3.5" /> },
    { id: 'night', label: 'Night Backlit', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'storm', label: 'Thunderstorm', icon: <CloudLightning className="w-3.5 h-3.5" /> },
  ];

  const flightPhases: { id: FlightPhase; label: string }[] = [
    { id: 'cold_dark', label: 'Cold & Dark' },
    { id: 'taxi', label: 'Taxi Gate' },
    { id: 'takeoff', label: 'Takeoff Roll' },
    { id: 'cruise', label: 'Cruise FL350' },
    { id: 'approach', label: 'ILS Approach' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-[940px] pointer-events-auto">
      {/* Interactive Item Tooltip Badge (Floats directly above the dock) */}
      {(activeHover || activeSelection) && (
        <div className="mb-2 mx-auto w-fit bg-[#12161f] border border-[#334155] px-3.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-200">
            {activeHover?.name || activeSelection?.name}
          </span>
          <span className="text-slate-400">
            [{activeHover?.panel || activeSelection?.panel}]
          </span>
          <span className="text-amber-400 font-mono">
            {activeHover?.instruction || activeSelection?.stateDescription}
          </span>
        </div>
      )}

      {/* Main Glassmorphic Dock Container (Solid/RGBA surfaces per Three.js skill) */}
      <div className="bg-[#0f141c]/95 border border-[#273244] rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Top Header & Telemetry Strip */}
        <div className="px-4 py-2 border-b border-[#1f2937] flex items-center justify-between text-xs font-mono">
          {/* Aircraft Model and State */}
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider text-sky-400 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              BOEING 737-800
            </span>
            <div className="h-3 w-px bg-slate-700" />
            <span className="text-slate-400">
              ALT <strong className="text-slate-100">{Math.round(s.altitude)} FT</strong>
            </span>
            <span className="text-slate-400">
              SPD <strong className="text-slate-100">{Math.round(s.airspeed)} KT</strong>
            </span>
            <span className="text-slate-400">
              HDG <strong className="text-slate-100">{Math.round(s.heading)}°</strong>
            </span>
            <span className="text-slate-400 hidden sm:inline">
              N1 <strong className="text-emerald-400">{s.eng1N1.toFixed(1)}%</strong>
            </span>
            <span className="text-slate-400 hidden md:inline">
              FLAPS <strong className="text-amber-400">{Math.round(s.actualFlapAngle)}°</strong>
            </span>
            <span className="text-slate-400 hidden md:inline">
              GEAR <strong className={s.actualGear > 0.9 ? 'text-emerald-400' : 'text-slate-400'}>{s.gearLever}</strong>
            </span>
            {s.apCmdA && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold text-[10px]">
                AP CMD A
              </span>
            )}
          </div>

          {/* Sound & Collapse Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Show Controls' : 'Hide Controls'}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#1c2433] hover:bg-[#273347] text-slate-300 hover:text-white transition-colors text-[11px]"
            >
              {collapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Drawer Section */}
        {!collapsed && (
          <div className="p-3">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 mb-3 text-xs">
              <button
                onClick={() => setActiveTab('views')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'views'
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Cameras (1-7)</span>
              </button>

              <button
                onClick={() => setActiveTab('lighting')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'lighting'
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Lighting & Ambience</span>
              </button>

              <button
                onClick={() => setActiveTab('flight')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'flight'
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Flight Scenarios</span>
              </button>

              <button
                onClick={() => setActiveTab('controls')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'controls'
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Quick Switches</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ml-auto ${
                  activeTab === 'guide'
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Hotkeys & Guide</span>
              </button>
            </div>

            {/* Tab 1: Camera Views */}
            {activeTab === 'views' && (
              <div className="flex flex-wrap items-center gap-2">
                {cameraButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => {
                      onSelectCamera(btn.id);
                      cockpitAudio.playSwitchClick();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      s.cameraPreset === btn.id
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'bg-[#18202d] text-slate-300 hover:bg-[#222c3d] hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{btn.label}</span>
                    <kbd className="px-1 py-0.2 rounded bg-black/30 text-[10px] text-slate-300 font-mono">
                      {btn.key}
                    </kbd>
                  </button>
                ))}
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  Tip: Right-click & drag anywhere to look around smoothly.
                </span>
              </div>
            )}

            {/* Tab 2: Lighting & Ambience */}
            {activeTab === 'lighting' && (
              <div className="flex flex-wrap items-center gap-3">
                {lightingModes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectLighting(m.id);
                      cockpitAudio.playSwitchClick();
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      s.lightingMode === m.id
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                        : 'bg-[#18202d] text-slate-300 hover:bg-[#222c3d] hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  onClick={() => {
                    sim.handleInteraction('dome_light');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#18202d] hover:bg-[#222c3d] border border-slate-700/60 text-slate-300 flex items-center gap-1.5"
                >
                  <span>Dome Light:</span>
                  <strong className="text-amber-400">
                    {s.domeLight === 2 ? 'Bright' : s.domeLight === 1 ? 'Dim' : 'Off'}
                  </strong>
                </button>

                <button
                  onClick={() => {
                    sim.handleInteraction('panel_backlight_toggle');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#18202d] hover:bg-[#222c3d] border border-slate-700/60 text-slate-300 flex items-center gap-1.5"
                >
                  <span>Integral Amber Glow:</span>
                  <strong className={s.panelBacklight > 0.3 ? 'text-amber-400' : 'text-slate-500'}>
                    {s.panelBacklight > 0.3 ? 'ON' : 'OFF'}
                  </strong>
                </button>
              </div>
            )}

            {/* Tab 3: Flight Scenarios */}
            {activeTab === 'flight' && (
              <div className="flex flex-wrap items-center gap-2.5">
                {flightPhases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => onSelectPhase(phase.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#18202d] hover:bg-[#222c3d] text-slate-200 hover:text-white border border-slate-700/60 transition-colors"
                  >
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span>{phase.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 4: Quick Controls */}
            {activeTab === 'controls' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => sim.handleInteraction('btn_cmd_a')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    s.apCmdA
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#18202d] text-slate-300 hover:bg-[#222c3d] border border-slate-700'
                  }`}
                >
                  Autopilot CMD A: {s.apCmdA ? 'ENGAGED' : 'OFF'}
                </button>

                <button
                  onClick={() => sim.handleInteraction('at_arm_switch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    s.atArm
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#18202d] text-slate-300 hover:bg-[#222c3d] border border-slate-700'
                  }`}
                >
                  A/T Arm: {s.atArm ? 'ARMED' : 'OFF'}
                </button>

                <button
                  onClick={() => sim.handleInteraction('gear_lever')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    s.gearLever === 'DOWN'
                      ? 'bg-emerald-600/80 text-white'
                      : 'bg-[#18202d] text-slate-300 hover:bg-[#222c3d] border border-slate-700'
                  }`}
                >
                  Gear Lever: {s.gearLever} [G]
                </button>

                <button
                  onClick={() => sim.handleInteraction('flap_lever')}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#18202d] hover:bg-[#222c3d] border border-slate-700 text-slate-200"
                >
                  Flaps Detent: <strong className="text-amber-400">{Math.round(s.actualFlapAngle)}°</strong> [ / ]
                </button>

                <button
                  onClick={() => sim.handleInteraction('parking_brake')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    s.parkingBrake
                      ? 'bg-red-600 text-white'
                      : 'bg-[#18202d] text-slate-300 hover:bg-[#222c3d] border border-slate-700'
                  }`}
                >
                  Parking Brake: {s.parkingBrake ? 'SET' : 'RELEASED'} [B]
                </button>

                <button
                  onClick={() => sim.handleInteraction('seatbelt_sign')}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#18202d] hover:bg-[#222c3d] border border-slate-700 text-slate-200"
                >
                  Seatbelts Chime: <strong className="text-sky-400">{s.seatbeltSign ? 'ON' : 'OFF'}</strong>
                </button>
              </div>
            )}

            {/* Tab 5: Hotkeys & Flight Deck Guide */}
            {activeTab === 'guide' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                <div className="bg-[#141b24] p-2 rounded border border-slate-800">
                  <span className="font-semibold text-sky-400 block mb-1">Flight Control Yoke</span>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">W</kbd> / <kbd className="font-mono bg-black/40 px-1 rounded">S</kbd> : Pitch Nose Down / Up</div>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">A</kbd> / <kbd className="font-mono bg-black/40 px-1 rounded">D</kbd> : Roll Bank Left / Right</div>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">Q</kbd> / <kbd className="font-mono bg-black/40 px-1 rounded">E</kbd> : Rudder Yaw Pedals</div>
                </div>

                <div className="bg-[#141b24] p-2 rounded border border-slate-800">
                  <span className="font-semibold text-emerald-400 block mb-1">Throttles & Engine</span>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">F2</kbd> : Increase Thrust (N1)</div>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">F1</kbd> : Idle / Decrease Thrust</div>
                  <div>Click Cutoff levers under throttles</div>
                </div>

                <div className="bg-[#141b24] p-2 rounded border border-slate-800">
                  <span className="font-semibold text-amber-400 block mb-1">Surfaces & Gear</span>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">G</kbd> : Landing Gear Up / Down</div>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">[</kbd> / <kbd className="font-mono bg-black/40 px-1 rounded">]</kbd> : Retract / Extend Flaps</div>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">B</kbd> : Parking Brake Toggle</div>
                </div>

                <div className="bg-[#141b24] p-2 rounded border border-slate-800">
                  <span className="font-semibold text-purple-400 block mb-1">Interactive Cockpit</span>
                  <div>Hover cursor over switches & knobs</div>
                  <div>Click Battery Guard, APU, Lights, FMC</div>
                  <div><kbd className="font-mono bg-black/40 px-1 rounded">Space</kbd> : Reset Master Caution</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
