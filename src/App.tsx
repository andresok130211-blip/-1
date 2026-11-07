/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CockpitScene } from './components/CockpitScene';
import { CockpitDock } from './components/CockpitDock';
import { CockpitSimulation } from './cockpit/simulation';
import { CameraPreset, InteractiveObjectInfo, LightingMode, FlightPhase } from './types/cockpit';
import { cockpitAudio } from './audio/cockpitAudio';

export default function App() {
  const sim = useMemo(() => new CockpitSimulation(), []);
  const [activeHover, setActiveHover] = useState<InteractiveObjectInfo | null>(null);
  const [activeSelection, setActiveSelection] = useState<InteractiveObjectInfo | null>(null);
  const [, setRenderTick] = useState(0);

  // Initialize audio context on first user click or keypress
  const handleUserGesture = () => {
    cockpitAudio.init();
    cockpitAudio.resume();
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    handleUserGesture();
    sim.state.cameraPreset = preset;
    setRenderTick((t) => t + 1);
  };

  const handleSelectLighting = (mode: LightingMode) => {
    handleUserGesture();
    sim.state.lightingMode = mode;
    setRenderTick((t) => t + 1);
  };

  const handleSelectPhase = (phase: FlightPhase) => {
    handleUserGesture();
    sim.setFlightPhase(phase);
    setRenderTick((t) => t + 1);
  };

  const handleHoverObject = (info: InteractiveObjectInfo | null) => {
    setActiveHover(info);
  };

  const handleSelectObject = (info: InteractiveObjectInfo) => {
    handleUserGesture();
    setActiveSelection(info);
    setRenderTick((t) => t + 1);
  };

  return (
    <div
      onClick={handleUserGesture}
      onKeyDown={handleUserGesture}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
    >
      {/* 3D Scene Viewport (100% full bleed, unobstructed center per Three.js skill) */}
      <CockpitScene
        sim={sim}
        onHoverObject={handleHoverObject}
        onSelectObject={handleSelectObject}
      />

      {/* Minimal Top-Left Spec Badge (Unobtrusive & Clean) */}
      <div className="fixed top-3 left-3 z-30 pointer-events-none">
        <div className="bg-[#0f141c]/90 border border-[#273244] px-3.5 py-2 rounded-lg shadow-xl text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wider text-slate-100 uppercase">
              Boeing 737-800 Flight Deck
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950/80 text-sky-400 border border-sky-800/60">
              3D Interactive
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Click switches, levers & knobs | Autopilot MCP | Dynamic PFD & ND
          </div>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Dock (Consolidates all controls) */}
      <CockpitDock
        sim={sim}
        activeHover={activeHover}
        activeSelection={activeSelection}
        onSelectCamera={handleSelectCamera}
        onSelectLighting={handleSelectLighting}
        onSelectPhase={handleSelectPhase}
      />
    </div>
  );
}
