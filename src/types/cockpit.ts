export type LightingMode = 'day' | 'sunset' | 'night' | 'storm';

export type CameraPreset =
  | 'captain'
  | 'fo'
  | 'mcp'
  | 'pedestal'
  | 'overhead'
  | 'fmc'
  | 'outside'
  | 'free';

export type FlightPhase =
  | 'cold_dark'
  | 'taxi'
  | 'takeoff'
  | 'climb'
  | 'cruise'
  | 'approach'
  | 'landing';

export interface AircraftSystemsState {
  // Electrical
  batteryMaster: boolean;
  batteryGuardOpen: boolean;
  standbyPower: boolean;
  apuStartSwitch: 'OFF' | 'ON' | 'START';
  apuRunning: boolean;
  apuRpm: number; // 0 - 100%
  apuGen1: boolean;
  apuGen2: boolean;
  gen1: boolean;
  gen2: boolean;
  busTrans: boolean;

  // Hydraulics & Fuel
  fuelPumpFwdL: boolean;
  fuelPumpAftL: boolean;
  fuelPumpFwdR: boolean;
  fuelPumpAftR: boolean;
  fuelPumpCenterL: boolean;
  fuelPumpCenterR: boolean;
  hydPumpEng1: boolean;
  hydPumpEng2: boolean;
  hydPumpElec1: boolean;
  hydPumpElec2: boolean;

  // Exterior & Cockpit Lighting
  landingLights: boolean;
  taxiLight: boolean;
  runwayTurnoff: boolean;
  strobeLight: boolean;
  beaconLight: boolean;
  navLight: boolean;
  logoLight: boolean;
  domeLight: number; // 0: off, 1: dim, 2: bright
  panelBacklight: number; // 0.0 - 1.0 (integral amber Boeing glow)
  floodLight: number; // 0.0 - 1.0
  masterCaution: boolean;
  masterWarning: boolean;
  seatbeltSign: boolean;
  noSmokingSign: boolean;

  // Engines & Throttles
  engStart1: 'GND' | 'OFF' | 'CONT' | 'FLT';
  engStart2: 'GND' | 'OFF' | 'CONT' | 'FLT';
  fuelCutoff1: boolean; // false = cutoff, true = idle/run
  fuelCutoff2: boolean;
  throttle1: number; // 0.0 - 1.0
  throttle2: number; // 0.0 - 1.0
  reverser1: boolean;
  reverser2: boolean;
  eng1N1: number; // 0 - 104%
  eng2N1: number;
  eng1N2: number; // 0 - 105%
  eng2N2: number;
  eng1EGT: number; // degrees C (ambient to 850)
  eng2EGT: number;
  fuelTotal: number; // in kg

  // Flight Controls & Surfaces
  flapLeverPosition: number; // index 0..8: 0=UP, 1=1, 2=2, 3=5, 4=10, 5=15, 6=25, 7=30, 8=40
  actualFlapAngle: number; // 0 to 40 degrees
  speedbrakePosition: number; // 0: DOWN, 1: ARMED, 2: FLIGHT DETENT, 3: UP
  gearLever: 'UP' | 'OFF' | 'DOWN';
  gearTransit: boolean;
  actualGear: number; // 0 (up) to 1 (down)
  parkingBrake: boolean;
  autobrake: 'OFF' | '1' | '2' | '3' | 'MAX' | 'RTO';
  yokePitch: number; // -1 to 1
  yokeRoll: number; // -1 to 1
  rudderPedal: number; // -1 to 1

  // MCP / Autopilot
  fdLeft: boolean;
  fdRight: boolean;
  atArm: boolean;
  apCmdA: boolean;
  apCmdB: boolean;
  apCwsA: boolean;
  apCwsB: boolean;
  mcpMode: 'OFF' | 'HDG_SEL' | 'LNAV' | 'VOR_LOC' | 'APP' | 'LVL_CHG' | 'ALT_HLD' | 'VS';
  targetSpeed: number; // 100 - 340 kts
  targetHeading: number; // 0 - 359 deg
  targetAltitude: number; // 0 - 41000 ft
  targetVerticalSpeed: number; // -6000 to +6000 fpm
  course1: number; // 0 - 359
  course2: number;

  // Flight Dynamics
  pitch: number; // degrees (-30 to +30)
  roll: number; // degrees (-60 to +60)
  heading: number; // degrees (0 - 359)
  altitude: number; // feet
  airspeed: number; // knots
  verticalSpeed: number; // fpm
  mach: number;
  onGround: boolean;
  groundSpeed: number;
  windSpeed: number;
  windHeading: number;

  // FMC Scratchpad & State
  fmcPage: 'RTE' | 'PERF' | 'LEGS' | 'INIT';
  fmcScratchpad: string;
  fmcMessage: string;

  // Environment & View
  lightingMode: LightingMode;
  cameraPreset: CameraPreset;
  soundEnabled: boolean;
  audioVolume: number;
  wipersRunning: boolean;
  wiperAngle: number;
  lightningActive: boolean;
}

export interface InteractiveObjectInfo {
  id: string;
  name: string;
  panel: 'Overhead' | 'MIP' | 'MCP' | 'Pedestal' | 'Flight Controls' | 'FMC';
  type: 'toggle' | 'pushbutton' | 'knob' | 'lever' | 'guard';
  stateDescription: string;
  instruction: string;
}
