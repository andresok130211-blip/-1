import { AircraftSystemsState, FlightPhase } from '../types/cockpit';
import { cockpitAudio } from '../audio/cockpitAudio';

export class CockpitSimulation {
  public state: AircraftSystemsState;
  private flapDetents = [0, 1, 2, 5, 10, 15, 25, 30, 40];
  private thunderTimer: number = 0;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): AircraftSystemsState {
    return {
      // Electrical
      batteryMaster: true,
      batteryGuardOpen: false,
      standbyPower: true,
      apuStartSwitch: 'ON',
      apuRunning: true,
      apuRpm: 100,
      apuGen1: true,
      apuGen2: true,
      gen1: true,
      gen2: true,
      busTrans: true,

      // Fuel & Hydraulics
      fuelPumpFwdL: true,
      fuelPumpAftL: true,
      fuelPumpFwdR: true,
      fuelPumpAftR: true,
      fuelPumpCenterL: false,
      fuelPumpCenterR: false,
      hydPumpEng1: true,
      hydPumpEng2: true,
      hydPumpElec1: true,
      hydPumpElec2: true,

      // Lighting
      landingLights: false,
      taxiLight: true,
      runwayTurnoff: false,
      strobeLight: true,
      beaconLight: true,
      navLight: true,
      logoLight: true,
      domeLight: 1, // dim
      panelBacklight: 0.8, // warm Boeing integral backlight
      floodLight: 0.5,
      masterCaution: false,
      masterWarning: false,
      seatbeltSign: true,
      noSmokingSign: true,

      // Engines & Throttles
      engStart1: 'OFF',
      engStart2: 'OFF',
      fuelCutoff1: true,
      fuelCutoff2: true,
      throttle1: 0.32,
      throttle2: 0.32,
      reverser1: false,
      reverser2: false,
      eng1N1: 62.0,
      eng2N1: 62.0,
      eng1N2: 84.0,
      eng2N2: 84.0,
      eng1EGT: 480,
      eng2EGT: 480,
      fuelTotal: 12850,

      // Flight Controls
      flapLeverPosition: 3, // Flaps 5
      actualFlapAngle: 5,
      speedbrakePosition: 0,
      gearLever: 'DOWN',
      gearTransit: false,
      actualGear: 1.0,
      parkingBrake: false,
      autobrake: '1',
      yokePitch: 0,
      yokeRoll: 0,
      rudderPedal: 0,

      // MCP / Autopilot
      fdLeft: true,
      fdRight: true,
      atArm: true,
      apCmdA: false,
      apCmdB: false,
      apCwsA: false,
      apCwsB: false,
      mcpMode: 'HDG_SEL',
      targetSpeed: 180,
      targetHeading: 260,
      targetAltitude: 5000,
      targetVerticalSpeed: 0,
      course1: 260,
      course2: 260,

      // Flight Dynamics
      pitch: 3.5,
      roll: 0.0,
      heading: 260,
      altitude: 4200,
      airspeed: 175,
      verticalSpeed: 0,
      mach: 0.28,
      onGround: false,
      groundSpeed: 168,
      windSpeed: 12,
      windHeading: 280,

      // FMC
      fmcPage: 'RTE',
      fmcScratchpad: '',
      fmcMessage: '',

      // Environment & View
      lightingMode: 'day',
      cameraPreset: 'captain',
      soundEnabled: true,
      audioVolume: 0.6,
      wipersRunning: false,
      wiperAngle: 0,
      lightningActive: false,
    };
  }

  /**
   * Set flight phase preset (Cold & Dark, Taxi, Takeoff, Cruise, Approach)
   */
  public setFlightPhase(phase: FlightPhase) {
    cockpitAudio.playHeavyClunk();

    switch (phase) {
      case 'cold_dark':
        this.state.batteryMaster = false;
        this.state.batteryGuardOpen = false;
        this.state.apuStartSwitch = 'OFF';
        this.state.apuRunning = false;
        this.state.apuRpm = 0;
        this.state.gen1 = false;
        this.state.gen2 = false;
        this.state.fuelCutoff1 = false;
        this.state.fuelCutoff2 = false;
        this.state.throttle1 = 0;
        this.state.throttle2 = 0;
        this.state.eng1N1 = 0;
        this.state.eng2N1 = 0;
        this.state.eng1N2 = 0;
        this.state.eng2N2 = 0;
        this.state.altitude = 620; // airport field elevation
        this.state.airspeed = 0;
        this.state.pitch = 0;
        this.state.roll = 0;
        this.state.onGround = true;
        this.state.parkingBrake = true;
        this.state.gearLever = 'DOWN';
        this.state.actualGear = 1.0;
        this.state.flapLeverPosition = 0;
        this.state.actualFlapAngle = 0;
        this.state.apCmdA = false;
        this.state.domeLight = 0;
        break;

      case 'taxi':
        this.state.batteryMaster = true;
        this.state.apuRunning = true;
        this.state.apuRpm = 100;
        this.state.gen1 = true;
        this.state.gen2 = true;
        this.state.fuelCutoff1 = true;
        this.state.fuelCutoff2 = true;
        this.state.throttle1 = 0.12;
        this.state.throttle2 = 0.12;
        this.state.altitude = 620;
        this.state.airspeed = 18;
        this.state.pitch = 0;
        this.state.roll = 0;
        this.state.onGround = true;
        this.state.parkingBrake = false;
        this.state.taxiLight = true;
        this.state.landingLights = false;
        this.state.flapLeverPosition = 3; // Flaps 5
        this.state.actualFlapAngle = 5;
        this.state.gearLever = 'DOWN';
        this.state.actualGear = 1.0;
        this.state.targetHeading = 260;
        this.state.targetAltitude = 10000;
        this.state.targetSpeed = 160;
        break;

      case 'takeoff':
        this.state.batteryMaster = true;
        this.state.fuelCutoff1 = true;
        this.state.fuelCutoff2 = true;
        this.state.throttle1 = 0.92;
        this.state.throttle2 = 0.92;
        this.state.altitude = 650;
        this.state.airspeed = 145;
        this.state.pitch = 8.0;
        this.state.roll = 0;
        this.state.onGround = true;
        this.state.parkingBrake = false;
        this.state.landingLights = true;
        this.state.strobeLight = true;
        this.state.flapLeverPosition = 3; // Flaps 5
        this.state.actualFlapAngle = 5;
        this.state.gearLever = 'DOWN';
        this.state.targetSpeed = 160;
        this.state.targetAltitude = 10000;
        break;

      case 'cruise':
        this.state.batteryMaster = true;
        this.state.fuelCutoff1 = true;
        this.state.fuelCutoff2 = true;
        this.state.throttle1 = 0.72;
        this.state.throttle2 = 0.72;
        this.state.altitude = 35000;
        this.state.airspeed = 285;
        this.state.mach = 0.785;
        this.state.pitch = 2.2;
        this.state.roll = 0;
        this.state.onGround = false;
        this.state.parkingBrake = false;
        this.state.landingLights = false;
        this.state.strobeLight = true;
        this.state.flapLeverPosition = 0; // Flaps UP
        this.state.actualFlapAngle = 0;
        this.state.gearLever = 'UP';
        this.state.actualGear = 0.0;
        this.state.atArm = true;
        this.state.apCmdA = true;
        this.state.mcpMode = 'LNAV';
        this.state.targetAltitude = 35000;
        this.state.targetSpeed = 285;
        this.state.targetHeading = 260;
        break;

      case 'approach':
        this.state.batteryMaster = true;
        this.state.fuelCutoff1 = true;
        this.state.fuelCutoff2 = true;
        this.state.throttle1 = 0.44;
        this.state.throttle2 = 0.44;
        this.state.altitude = 2800;
        this.state.airspeed = 142;
        this.state.pitch = 2.8;
        this.state.roll = 0;
        this.state.onGround = false;
        this.state.parkingBrake = false;
        this.state.landingLights = true;
        this.state.flapLeverPosition = 7; // Flaps 30
        this.state.actualFlapAngle = 30;
        this.state.gearLever = 'DOWN';
        this.state.actualGear = 1.0;
        this.state.atArm = true;
        this.state.apCmdA = true;
        this.state.mcpMode = 'APP';
        this.state.targetSpeed = 142;
        this.state.targetAltitude = 2500;
        this.state.targetHeading = 260;
        break;
    }
  }

  /**
   * Handle user click on interactive cockpit items
   */
  public handleInteraction(id: string) {
    const s = this.state;

    switch (id) {
      // Landing Gear
      case 'gear_lever':
        cockpitAudio.playHeavyClunk();
        if (s.gearLever === 'DOWN') {
          s.gearLever = 'UP';
          s.gearTransit = true;
        } else {
          s.gearLever = 'DOWN';
          s.gearTransit = true;
        }
        break;

      // Autobrake
      case 'autobrake_knob': {
        cockpitAudio.playKnobTick();
        const modes: AircraftSystemsState['autobrake'][] = ['OFF', '1', '2', '3', 'MAX', 'RTO'];
        const curIdx = modes.indexOf(s.autobrake);
        s.autobrake = modes[(curIdx + 1) % modes.length];
        break;
      }

      // Master Caution / Warning acknowledge
      case 'master_caution':
        cockpitAudio.playSwitchClick();
        s.masterCaution = false;
        break;

      case 'master_warning':
        cockpitAudio.playSwitchClick();
        s.masterWarning = false;
        break;

      // MCP Knobs
      case 'mcp_speed_knob':
        cockpitAudio.playKnobTick();
        s.targetSpeed = s.targetSpeed >= 330 ? 120 : s.targetSpeed + 10;
        break;

      case 'mcp_heading_knob':
        cockpitAudio.playKnobTick();
        s.targetHeading = (s.targetHeading + 10) % 360;
        break;

      case 'mcp_altitude_knob':
        cockpitAudio.playKnobTick();
        s.targetAltitude = s.targetAltitude >= 41000 ? 1000 : s.targetAltitude + 1000;
        break;

      case 'mcp_vs_wheel':
        cockpitAudio.playKnobTick();
        s.targetVerticalSpeed = s.targetVerticalSpeed >= 3000 ? -3000 : s.targetVerticalSpeed + 500;
        break;

      // MCP Toggles & Buttons
      case 'fd_capt_switch':
        cockpitAudio.playSwitchClick();
        s.fdLeft = !s.fdLeft;
        break;

      case 'fd_fo_switch':
        cockpitAudio.playSwitchClick();
        s.fdRight = !s.fdRight;
        break;

      case 'at_arm_switch':
        cockpitAudio.playSwitchClick();
        s.atArm = !s.atArm;
        break;

      case 'btn_cmd_a':
        cockpitAudio.playSwitchClick();
        s.apCmdA = !s.apCmdA;
        if (s.apCmdA) s.mcpMode = 'HDG_SEL';
        break;

      case 'btn_cmd_b':
        cockpitAudio.playSwitchClick();
        s.apCmdB = !s.apCmdB;
        break;

      case 'btn_hdg_sel':
        cockpitAudio.playSwitchClick();
        s.mcpMode = s.mcpMode === 'HDG_SEL' ? 'OFF' : 'HDG_SEL';
        break;

      case 'btn_lnav':
        cockpitAudio.playSwitchClick();
        s.mcpMode = s.mcpMode === 'LNAV' ? 'OFF' : 'LNAV';
        break;

      case 'btn_vnav':
        cockpitAudio.playSwitchClick();
        s.mcpMode = s.mcpMode === 'LVL_CHG' ? 'OFF' : 'LVL_CHG';
        break;

      case 'btn_app':
        cockpitAudio.playSwitchClick();
        s.mcpMode = s.mcpMode === 'APP' ? 'OFF' : 'APP';
        break;

      case 'btn_alt_hld':
        cockpitAudio.playSwitchClick();
        s.mcpMode = s.mcpMode === 'ALT_HLD' ? 'OFF' : 'ALT_HLD';
        break;

      case 'btn_vs':
        cockpitAudio.playSwitchClick();
        s.mcpMode = s.mcpMode === 'VS' ? 'OFF' : 'VS';
        break;

      // Throttle Levers
      case 'throttle_1':
      case 'throttle_2':
        cockpitAudio.playSwitchClick();
        s.throttle1 = s.throttle1 >= 0.9 ? 0.1 : s.throttle1 + 0.2;
        s.throttle2 = s.throttle1;
        break;

      case 'flap_lever': {
        cockpitAudio.playHeavyClunk();
        s.flapLeverPosition = (s.flapLeverPosition + 1) % this.flapDetents.length;
        break;
      }

      case 'speedbrake_lever':
        cockpitAudio.playHeavyClunk();
        s.speedbrakePosition = (s.speedbrakePosition + 1) % 4;
        break;

      case 'fuel_cutoff_1':
        cockpitAudio.playHeavyClunk();
        s.fuelCutoff1 = !s.fuelCutoff1;
        break;

      case 'fuel_cutoff_2':
        cockpitAudio.playHeavyClunk();
        s.fuelCutoff2 = !s.fuelCutoff2;
        break;

      case 'parking_brake':
        cockpitAudio.playHeavyClunk();
        s.parkingBrake = !s.parkingBrake;
        break;

      case 'fmc_cdu': {
        cockpitAudio.playSwitchClick();
        const pages: AircraftSystemsState['fmcPage'][] = ['RTE', 'PERF', 'LEGS'];
        const nextIdx = (pages.indexOf(s.fmcPage) + 1) % pages.length;
        s.fmcPage = pages[nextIdx];
        break;
      }

      // Overhead Electrical
      case 'bat_guard':
        cockpitAudio.playHeavyClunk();
        s.batteryGuardOpen = !s.batteryGuardOpen;
        break;

      case 'battery_master':
        cockpitAudio.playSwitchClick();
        if (s.batteryGuardOpen || s.batteryMaster) {
          s.batteryMaster = !s.batteryMaster;
        } else {
          // Open guard first
          s.batteryGuardOpen = true;
          s.batteryMaster = true;
        }
        break;

      case 'apu_start':
        cockpitAudio.playSwitchClick();
        if (s.apuStartSwitch === 'OFF') {
          s.apuStartSwitch = 'ON';
          s.apuRunning = true;
        } else {
          s.apuStartSwitch = 'OFF';
          s.apuRunning = false;
        }
        break;

      case 'eng_start_1': {
        cockpitAudio.playKnobTick();
        const pos: AircraftSystemsState['engStart1'][] = ['OFF', 'GND', 'CONT', 'FLT'];
        s.engStart1 = pos[(pos.indexOf(s.engStart1) + 1) % pos.length];
        break;
      }

      case 'eng_start_2': {
        cockpitAudio.playKnobTick();
        const pos: AircraftSystemsState['engStart2'][] = ['OFF', 'GND', 'CONT', 'FLT'];
        s.engStart2 = pos[(pos.indexOf(s.engStart2) + 1) % pos.length];
        break;
      }

      // Overhead Toggles
      case 'landing_lts':
        cockpitAudio.playSwitchClick();
        s.landingLights = !s.landingLights;
        break;

      case 'runway_turnoff':
        cockpitAudio.playSwitchClick();
        s.runwayTurnoff = !s.runwayTurnoff;
        break;

      case 'taxi_light':
        cockpitAudio.playSwitchClick();
        s.taxiLight = !s.taxiLight;
        break;

      case 'strobe_light':
        cockpitAudio.playSwitchClick();
        s.strobeLight = !s.strobeLight;
        break;

      case 'beacon_light':
        cockpitAudio.playSwitchClick();
        s.beaconLight = !s.beaconLight;
        break;

      case 'nav_lights':
        cockpitAudio.playSwitchClick();
        s.navLight = !s.navLight;
        break;

      case 'seatbelt_sign':
        cockpitAudio.playSwitchClick();
        cockpitAudio.playCabinChime();
        s.seatbeltSign = !s.seatbeltSign;
        break;

      case 'no_smoking':
        cockpitAudio.playSwitchClick();
        cockpitAudio.playCabinChime();
        s.noSmokingSign = !s.noSmokingSign;
        break;

      case 'dome_light':
        cockpitAudio.playSwitchClick();
        s.domeLight = (s.domeLight + 1) % 3;
        break;

      case 'panel_backlight_toggle':
        cockpitAudio.playSwitchClick();
        s.panelBacklight = s.panelBacklight > 0.3 ? 0.0 : 0.85;
        break;

      default:
        cockpitAudio.playSwitchClick();
        break;
    }
  }

  /**
   * Main physical update step (spool-up, aerodynamics, autopilot guidance)
   */
  public update(dt: number) {
    const s = this.state;
    const clampedDt = Math.min(0.1, dt);

    // 1. APU turbine spool
    if (s.apuRunning && s.batteryMaster) {
      s.apuRpm = Math.min(100, s.apuRpm + clampedDt * 18);
    } else {
      s.apuRpm = Math.max(0, s.apuRpm - clampedDt * 12);
    }

    // 2. Engine spool curves (CFM56-7B)
    const targetN1_1 = (s.fuelCutoff1 && (s.gen1 || s.apuRpm > 80 || s.batteryMaster))
      ? 20.0 + s.throttle1 * 84.0
      : 0.0;
    const targetN1_2 = (s.fuelCutoff2 && (s.gen2 || s.apuRpm > 80 || s.batteryMaster))
      ? 20.0 + s.throttle2 * 84.0
      : 0.0;

    s.eng1N1 += (targetN1_1 - s.eng1N1) * Math.min(1, clampedDt * 2.5);
    s.eng2N1 += (targetN1_2 - s.eng2N1) * Math.min(1, clampedDt * 2.5);

    s.eng1N2 = Math.min(105, s.eng1N1 * 1.06);
    s.eng2N2 = Math.min(105, s.eng2N1 * 1.06);

    s.eng1EGT = 35 + s.eng1N1 * 5.8;
    s.eng2EGT = 35 + s.eng2N1 * 5.8;

    // 3. Flap transit
    const targetFlapAngle = this.flapDetents[s.flapLeverPosition] || 0;
    if (Math.abs(s.actualFlapAngle - targetFlapAngle) > 0.1) {
      const flapDir = Math.sign(targetFlapAngle - s.actualFlapAngle);
      s.actualFlapAngle += flapDir * clampedDt * 6.5; // ~6 degrees/sec
    } else {
      s.actualFlapAngle = targetFlapAngle;
    }

    // 4. Gear transit
    const targetGear = s.gearLever === 'DOWN' ? 1.0 : 0.0;
    if (Math.abs(s.actualGear - targetGear) > 0.01) {
      s.gearTransit = true;
      const gearDir = Math.sign(targetGear - s.actualGear);
      s.actualGear += gearDir * clampedDt * 0.14; // ~7 seconds full transit
    } else {
      s.actualGear = targetGear;
      s.gearTransit = false;
    }

    // 5. Autopilot flight director & guidance
    if (s.apCmdA || s.apCmdB) {
      // Heading Hold / Turn
      let hdgDiff = ((s.targetHeading - s.heading + 540) % 360) - 180;
      const targetRoll = Math.max(-25, Math.min(25, hdgDiff * 1.5));
      s.roll += (targetRoll - s.roll) * Math.min(1, clampedDt * 2.0);
      s.heading = (s.heading - s.roll * clampedDt * 0.4 + 360) % 360;

      // Altitude Hold / Vertical Speed
      const altDiff = s.targetAltitude - s.altitude;
      const targetVS = Math.max(-3000, Math.min(3000, altDiff * 1.2));
      s.verticalSpeed += (targetVS - s.verticalSpeed) * Math.min(1, clampedDt * 2.5);
      s.altitude += (s.verticalSpeed / 60) * clampedDt;

      // Pitch follows vertical speed & speed
      const targetPitch = 2.0 + (s.verticalSpeed / 1000) * 1.8;
      s.pitch += (targetPitch - s.pitch) * Math.min(1, clampedDt * 2.0);

      // Autothrottle Speed Hold
      if (s.atArm) {
        const speedDiff = s.targetSpeed - s.airspeed;
        const targetThrot = Math.max(0.15, Math.min(0.96, 0.45 + speedDiff * 0.02));
        s.throttle1 += (targetThrot - s.throttle1) * Math.min(1, clampedDt * 1.2);
        s.throttle2 = s.throttle1;
      }
    } else if (!s.onGround) {
      // Manual control via Yoke pitch/roll input
      s.pitch += (s.yokePitch * 15 - s.pitch) * Math.min(1, clampedDt * 4.0);
      s.roll += (s.yokeRoll * 35 - s.roll) * Math.min(1, clampedDt * 4.0);
      s.heading = (s.heading - s.roll * clampedDt * 0.35 + 360) % 360;

      s.verticalSpeed = (s.pitch - 2.5) * 450;
      s.altitude += (s.verticalSpeed / 60) * clampedDt;
    }

    // Ground interaction & minimum altitude
    if (s.altitude <= 620) {
      s.altitude = 620;
      s.onGround = true;
      s.verticalSpeed = 0;
      s.pitch = Math.max(-0.5, Math.min(8, s.pitch));
      s.roll = 0;
    } else {
      s.onGround = false;
    }

    // Airspeed dynamics
    const avgN1 = (s.eng1N1 + s.eng2N1) / 2;
    const flapDrag = (s.actualFlapAngle / 40) * 22;
    const gearDrag = s.actualGear * 18;
    const speedbrakeDrag = (s.speedbrakePosition / 3) * 25;

    const targetSpeedKts = s.onGround
      ? (avgN1 > 35 ? (avgN1 / 100) * 160 : (s.parkingBrake ? 0 : 15))
      : 140 + (avgN1 / 100) * 180 - flapDrag - gearDrag - speedbrakeDrag;

    s.airspeed += (targetSpeedKts - s.airspeed) * Math.min(1, clampedDt * 0.8);
    s.mach = s.airspeed / (661 * Math.sqrt(Math.max(0.7, 1 - s.altitude / 145000)));
    s.groundSpeed = Math.max(0, s.airspeed - s.windSpeed * 0.4);

    // Fuel consumption
    const totalFF = ((s.eng1N1 + s.eng2N1) / 200) * 2200; // kg/hr
    s.fuelTotal = Math.max(500, s.fuelTotal - (totalFF / 3600) * clampedDt);

    // Wipers sweep
    if (s.wipersRunning) {
      s.wiperAngle = (s.wiperAngle + clampedDt * 7.0) % (Math.PI * 2);
    }

    // Storm mode thunder & lightning
    if (s.lightingMode === 'storm') {
      this.thunderTimer += clampedDt;
      if (this.thunderTimer > 12) {
        this.thunderTimer = 0;
        s.lightningActive = true;
        cockpitAudio.playThunder();
        setTimeout(() => {
          s.lightningActive = false;
        }, 120);
      }
    } else {
      s.lightningActive = false;
    }

    // Audio update
    cockpitAudio.updateEngines(avgN1, s.fuelCutoff1 || s.fuelCutoff2, s.lightingMode === 'storm');
  }
}
