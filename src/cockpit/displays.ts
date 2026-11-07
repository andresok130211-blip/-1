import * as THREE from 'three';
import { AircraftSystemsState } from '../types/cockpit';

export class CockpitDisplays {
  private pfdCanvas: HTMLCanvasElement;
  private pfdCtx: CanvasRenderingContext2D;
  public pfdTexture: THREE.CanvasTexture;

  private ndCanvas: HTMLCanvasElement;
  private ndCtx: CanvasRenderingContext2D;
  public ndTexture: THREE.CanvasTexture;

  private upperEicasCanvas: HTMLCanvasElement;
  private upperEicasCtx: CanvasRenderingContext2D;
  public upperEicasTexture: THREE.CanvasTexture;

  private lowerEicasCanvas: HTMLCanvasElement;
  private lowerEicasCtx: CanvasRenderingContext2D;
  public lowerEicasTexture: THREE.CanvasTexture;

  private fmcCanvas: HTMLCanvasElement;
  private fmcCtx: CanvasRenderingContext2D;
  public fmcTexture: THREE.CanvasTexture;

  private radarSweepAngle: number = 0;

  constructor() {
    // 1. PFD (512x512)
    this.pfdCanvas = document.createElement('canvas');
    this.pfdCanvas.width = 512;
    this.pfdCanvas.height = 512;
    this.pfdCtx = this.pfdCanvas.getContext('2d')!;
    this.pfdTexture = new THREE.CanvasTexture(this.pfdCanvas);
    this.pfdTexture.colorSpace = THREE.SRGBColorSpace;

    // 2. ND (512x512)
    this.ndCanvas = document.createElement('canvas');
    this.ndCanvas.width = 512;
    this.ndCanvas.height = 512;
    this.ndCtx = this.ndCanvas.getContext('2d')!;
    this.ndTexture = new THREE.CanvasTexture(this.ndCanvas);
    this.ndTexture.colorSpace = THREE.SRGBColorSpace;

    // 3. Upper EICAS (512x512)
    this.upperEicasCanvas = document.createElement('canvas');
    this.upperEicasCanvas.width = 512;
    this.upperEicasCanvas.height = 512;
    this.upperEicasCtx = this.upperEicasCanvas.getContext('2d')!;
    this.upperEicasTexture = new THREE.CanvasTexture(this.upperEicasCanvas);
    this.upperEicasTexture.colorSpace = THREE.SRGBColorSpace;

    // 4. Lower EICAS (512x512)
    this.lowerEicasCanvas = document.createElement('canvas');
    this.lowerEicasCanvas.width = 512;
    this.lowerEicasCanvas.height = 512;
    this.lowerEicasCtx = this.lowerEicasCanvas.getContext('2d')!;
    this.lowerEicasTexture = new THREE.CanvasTexture(this.lowerEicasCanvas);
    this.lowerEicasTexture.colorSpace = THREE.SRGBColorSpace;

    // 5. FMC CDU Screen (512x512)
    this.fmcCanvas = document.createElement('canvas');
    this.fmcCanvas.width = 512;
    this.fmcCanvas.height = 512;
    this.fmcCtx = this.fmcCanvas.getContext('2d')!;
    this.fmcTexture = new THREE.CanvasTexture(this.fmcCanvas);
    this.fmcTexture.colorSpace = THREE.SRGBColorSpace;
  }

  public update(state: AircraftSystemsState, dt: number) {
    const isPowered = state.batteryMaster && (state.gen1 || state.gen2 || state.apuGen1 || state.apuGen2 || state.standbyPower);

    this.radarSweepAngle = (this.radarSweepAngle + dt * 1.8) % (Math.PI * 2);

    this.renderPFD(state, isPowered);
    this.renderND(state, isPowered);
    this.renderUpperEICAS(state, isPowered);
    this.renderLowerEICAS(state, isPowered);
    this.renderFMC(state, isPowered);

    this.pfdTexture.needsUpdate = true;
    this.ndTexture.needsUpdate = true;
    this.upperEicasTexture.needsUpdate = true;
    this.lowerEicasTexture.needsUpdate = true;
    this.fmcTexture.needsUpdate = true;
  }

  /**
   * Primary Flight Display
   */
  private renderPFD(s: AircraftSystemsState, powered: boolean) {
    const ctx = this.pfdCtx;
    const w = 512;
    const h = 512;

    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, w, h);

    if (!powered) return;

    const cx = 256;
    const cy = 256;

    // --- Artificial Horizon Area (Center Mask) ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(110, 80, 292, 330);
    ctx.clip();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-s.roll * Math.PI) / 180);
    const pitchOffset = (s.pitch / 20) * 130;
    ctx.translate(0, pitchOffset);

    // Sky
    ctx.fillStyle = '#0070c0';
    ctx.fillRect(-350, -450, 700, 450);

    // Ground
    ctx.fillStyle = '#653b1b';
    ctx.fillRect(-350, 0, 700, 450);

    // Horizon line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-350, 0);
    ctx.lineTo(350, 0);
    ctx.stroke();

    // Pitch ladder (-20 to +20 degrees)
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let deg = -25; deg <= 25; deg += 5) {
      if (deg === 0) continue;
      const y = (-deg / 20) * 130;
      const lineLen = Math.abs(deg) % 10 === 0 ? 55 : 30;

      ctx.beginPath();
      ctx.moveTo(-lineLen, y);
      ctx.lineTo(lineLen, y);
      ctx.stroke();

      if (Math.abs(deg) % 10 === 0) {
        ctx.fillText(`${Math.abs(deg)}`, -lineLen - 16, y + 5);
        ctx.fillText(`${Math.abs(deg)}`, lineLen + 16, y + 5);
      }
    }

    ctx.restore(); // end horizon rotate/translate

    // Flight Director Magenta Crossbars (if enabled)
    if (s.fdLeft || s.fdRight) {
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 3.5;

      // Horizontal pitch command bar
      const fdPitch = cy - ((s.targetVerticalSpeed / 2000) * 25);
      ctx.beginPath();
      ctx.moveTo(170, fdPitch);
      ctx.lineTo(342, fdPitch);
      ctx.stroke();

      // Vertical roll command bar
      const headingDiff = ((s.targetHeading - s.heading + 540) % 360) - 180;
      const fdRoll = cx + Math.max(-50, Math.min(50, headingDiff * 2));
      ctx.beginPath();
      ctx.moveTo(fdRoll, 160);
      ctx.lineTo(fdRoll, 350);
      ctx.stroke();
    }

    // Aircraft fixed center symbol (black/yellow miniature wings)
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Center square
    ctx.strokeRect(cx - 5, cy - 5, 10, 10);
    // Left wing
    ctx.strokeRect(cx - 70, cy - 4, 45, 8);
    // Right wing
    ctx.strokeRect(cx + 25, cy - 4, 45, 8);

    ctx.restore(); // end clip

    // --- Roll pointer scale arc at top ---
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 145, (-140 * Math.PI) / 180, (-40 * Math.PI) / 180);
    ctx.stroke();

    // Roll indicator triangle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-s.roll * Math.PI) / 180);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -145);
    ctx.lineTo(-7, -132);
    ctx.lineTo(7, -132);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- Left Airspeed Tape ---
    ctx.fillStyle = '#1e242d';
    ctx.fillRect(15, 80, 85, 330);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 80, 85, 330);

    // Speed marks
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 80, 85, 330);
    ctx.clip();
    const speedCenterY = 245;
    const pxPerKnot = 3.2;

    for (let k = 40; k <= 360; k += 10) {
      const y = speedCenterY - (k - s.airspeed) * pxPerKnot;
      if (y > 70 && y < 420) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = k % 20 === 0 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(100, y);
        ctx.stroke();

        if (k % 20 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${k}`, 75, y + 5);
        }
      }
    }

    // Speed bug (cyan target speed)
    const targetSpeedY = speedCenterY - (s.targetSpeed - s.airspeed) * pxPerKnot;
    if (targetSpeedY > 80 && targetSpeedY < 410) {
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(96, targetSpeedY);
      ctx.lineTo(75, targetSpeedY - 8);
      ctx.lineTo(75, targetSpeedY + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Current digital speed readout box
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillRect(15, speedCenterY - 18, 85, 36);
    ctx.strokeRect(15, speedCenterY - 18, 85, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(s.airspeed)}`, 55, speedCenterY + 7);

    // Target Speed display at top of tape
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`${s.targetSpeed}`, 55, 65);

    // --- Right Altimeter Tape ---
    ctx.fillStyle = '#1e242d';
    ctx.fillRect(410, 80, 90, 330);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(410, 80, 90, 330);

    ctx.save();
    ctx.beginPath();
    ctx.rect(410, 80, 90, 330);
    ctx.clip();

    const altCenterY = 245;
    const pxPerFoot = 0.28;

    const baseAlt = Math.floor(s.altitude / 100) * 100;
    for (let a = baseAlt - 600; a <= baseAlt + 600; a += 100) {
      const y = altCenterY - (a - s.altitude) * pxPerFoot;
      if (y > 70 && y < 420) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = a % 500 === 0 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(410, y);
        ctx.lineTo(430, y);
        ctx.stroke();

        if (a % 200 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${a}`, 435, y + 5);
        }
      }
    }

    // Altitude target bug
    const targetAltY = altCenterY - (s.targetAltitude - s.altitude) * pxPerFoot;
    if (targetAltY > 80 && targetAltY < 410) {
      ctx.fillStyle = '#e040fb';
      ctx.beginPath();
      ctx.moveTo(410, targetAltY);
      ctx.lineTo(428, targetAltY - 8);
      ctx.lineTo(428, targetAltY + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Current digital alt readout box with rolling drum
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillRect(405, altCenterY - 18, 98, 36);
    ctx.strokeRect(405, altCenterY - 18, 98, 36);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(s.altitude)}`, 454, altCenterY + 7);

    // Target Altitude text at top of tape
    ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`${s.targetAltitude}`, 455, 65);

    // Baro readout at bottom
    ctx.fillStyle = '#22c55e';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText('STD 29.92 IN', 455, 435);

    // --- FMA (Flight Mode Annunciator) at top ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 15, 482, 35);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(15, 15, 482, 35);

    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    // A/T mode
    ctx.fillStyle = s.atArm ? '#22c55e' : '#64748b';
    ctx.fillText(s.atArm ? 'MCP SPD' : 'A/T OFF', 90, 38);

    // Roll mode
    ctx.fillStyle = s.mcpMode !== 'OFF' ? '#22c55e' : '#64748b';
    ctx.fillText(s.mcpMode === 'OFF' ? 'ROLL ATT' : s.mcpMode.replace('_', ' '), 256, 38);

    // Pitch mode
    ctx.fillStyle = (s.apCmdA || s.apCmdB) ? '#22c55e' : '#eab308';
    ctx.fillText((s.apCmdA || s.apCmdB) ? 'CMD' : 'FD', 420, 38);

    // Compass heading strip at bottom
    ctx.fillStyle = '#111827';
    ctx.fillRect(110, 420, 292, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HDG ${Math.round(s.heading).toString().padStart(3, '0')}°`, cx, 445);
    ctx.fillStyle = '#e040fb';
    ctx.fillText(`MAG ${s.targetHeading}°`, cx, 462);
  }

  /**
   * Navigation Display (ND)
   */
  private renderND(s: AircraftSystemsState, powered: boolean) {
    const ctx = this.ndCtx;
    const w = 512;
    const h = 512;

    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, w, h);

    if (!powered) return;

    const cx = 256;
    const cy = 340; // centered lower so arc fills upper 2/3

    // Info header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`GS ${Math.round(s.groundSpeed)}`, 25, 40);
    ctx.fillText(`TAS ${Math.round(s.airspeed * 1.05)}`, 25, 65);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`WIND ${s.windHeading}° / ${s.windSpeed}KT`, 485, 40);

    // Compass Rose Arc (90 deg visible)
    ctx.save();
    ctx.translate(cx, cy);

    // Weather radar sweep line
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.radarSweepAngle - Math.PI / 2) * 230, Math.sin(this.radarSweepAngle - Math.PI / 2) * 230);
    ctx.stroke();
    ctx.restore();

    // Range rings
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    [80, 150, 220].forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
    });

    // Rotate for aircraft heading
    ctx.rotate(((-s.heading) * Math.PI) / 180);

    // 360 Compass Ticks & Labels
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = ((deg - 90) * Math.PI) / 180;
      const rInner = deg % 30 === 0 ? 205 : 215;
      const rOuter = 225;

      const x1 = Math.cos(rad) * rInner;
      const y1 = Math.sin(rad) * rInner;
      const x2 = Math.cos(rad) * rOuter;
      const y2 = Math.sin(rad) * rOuter;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = deg % 30 === 0 ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (deg % 30 === 0) {
        const textR = 190;
        const tx = Math.cos(rad) * textR;
        const ty = Math.sin(rad) * textR;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rad + Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : `${deg / 10}`;
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }

    // Waypoints & Route lines
    const waypoints = [
      { name: 'HONTO', dist: 90, angle: -15 },
      { name: 'TIKTU', dist: 160, angle: 10 },
      { name: 'RWY26L', dist: 230, angle: 0 },
    ];

    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);

    waypoints.forEach((wp) => {
      const rad = ((wp.angle - 90 + s.heading) * Math.PI) / 180;
      const wx = Math.cos(rad) * wp.dist;
      const wy = Math.sin(rad) * wp.dist;
      ctx.lineTo(wx, wy);
    });
    ctx.stroke();

    // Waypoint icons & labels
    waypoints.forEach((wp) => {
      const rad = ((wp.angle - 90 + s.heading) * Math.PI) / 180;
      const wx = Math.cos(rad) * wp.dist;
      const wy = Math.sin(rad) * wp.dist;

      ctx.fillStyle = '#e040fb';
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(wp.name, wx, wy - 10);
    });

    // Heading Bug (Cyan)
    const bugRad = ((s.targetHeading - 90) * Math.PI) / 180;
    const bx = Math.cos(bugRad) * 225;
    const by = Math.sin(bugRad) * 225;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(bugRad + Math.PI / 2);
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, 14);
    ctx.lineTo(8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end compass rotate

    // Center Airplane Symbol (fixed white delta)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx - 10, cy + 12);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx + 10, cy + 12);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Upper EICAS: Primary Engine Parameters (N1, EGT, Fuel Flow, Fuel Total)
   */
  private renderUpperEICAS(s: AircraftSystemsState, powered: boolean) {
    const ctx = this.upperEicasCtx;
    const w = 512;
    const h = 512;

    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, w, h);

    if (!powered) return;

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENGINE PRIMARY (CFM56-7B)', 256, 30);

    // Dual N1 Dials
    this.drawEngineDial(ctx, 130, 140, 'N1 %', s.eng1N1, 104, '%');
    this.drawEngineDial(ctx, 380, 140, 'N1 %', s.eng2N1, 104, '%');

    // Dual EGT Dials
    this.drawEngineDial(ctx, 130, 310, 'EGT °C', s.eng1EGT, 950, '°C');
    this.drawEngineDial(ctx, 380, 310, 'EGT °C', s.eng2EGT, 950, '°C');

    // Fuel Flow Readouts
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FF KG/HR', 256, 400);

    const ff1 = Math.round((s.eng1N1 / 100) * 1150);
    const ff2 = Math.round((s.eng2N1 / 100) * 1150);

    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${ff1}`, 130, 425);
    ctx.fillText(`${ff2}`, 380, 425);

    // Total Fuel Quantity
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`TOTAL FUEL: ${Math.round(s.fuelTotal)} KG`, 256, 480);
  }

  private drawEngineDial(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    val: number,
    maxVal: number,
    unit: string
  ) {
    const radius = 55;
    const startAngle = (140 * Math.PI) / 180;
    const endAngle = (400 * Math.PI) / 180;
    const angleRange = endAngle - startAngle;

    // Dial background arc
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();

    // Value active arc (green to red if near limit)
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    const valAngle = startAngle + ratio * angleRange;
    ctx.strokeStyle = ratio > 0.92 ? '#ef4444' : ratio > 0.85 ? '#eab308' : '#22c55e';
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, valAngle);
    ctx.stroke();

    // Needle pointer
    const nx = x + Math.cos(valAngle) * (radius - 5);
    const ny = y + Math.sin(valAngle) * (radius - 5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    // Digital readout in center
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${val.toFixed(1)}`, x, y);

    // Label under dial
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(label, x, y + radius + 18);
  }

  /**
   * Lower EICAS: Secondary Engine Parameters & Tank Quantities
   */
  private renderLowerEICAS(s: AircraftSystemsState, powered: boolean) {
    const ctx = this.lowerEicasCtx;
    const w = 512;
    const h = 512;

    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, w, h);

    if (!powered) return;

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SECONDARY SYSTEMS & FUEL TANKS', 256, 30);

    // N2 gauges
    this.drawEngineDial(ctx, 130, 130, 'N2 %', s.eng1N2, 105, '%');
    this.drawEngineDial(ctx, 380, 130, 'N2 %', s.eng2N2, 105, '%');

    // Oil pressure & temp
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('OIL PRESS (PSI)', 256, 230);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${Math.round(35 + s.eng1N2 * 0.35)}`, 130, 255);
    ctx.fillText(`${Math.round(35 + s.eng2N2 * 0.35)}`, 380, 255);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('OIL TEMP (°C)', 256, 295);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${Math.round(75 + s.eng1N2 * 0.2)}`, 130, 320);
    ctx.fillText(`${Math.round(75 + s.eng2N2 * 0.2)}`, 380, 320);

    // Fuel Tank quantities
    ctx.fillStyle = '#ffffff';
    ctx.fillText('FUEL TANKS (KG)', 256, 380);
    const main1 = Math.round(s.fuelTotal * 0.42);
    const center = Math.round(s.fuelTotal * 0.16);
    const main2 = Math.round(s.fuelTotal * 0.42);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`MAIN 1: ${main1}`, 130, 420);
    ctx.fillText(`CTR: ${center}`, 256, 420);
    ctx.fillText(`MAIN 2: ${main2}`, 380, 420);

    // Hydraulic Pressures
    ctx.fillStyle = '#ffffff';
    ctx.fillText('HYD PRESS: SYS A 3000 PSI  |  SYS B 3000 PSI', 256, 475);
  }

  /**
   * FMC / CDU Interactive Display
   */
  private renderFMC(s: AircraftSystemsState, powered: boolean) {
    const ctx = this.fmcCtx;
    const w = 512;
    const h = 512;

    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, w, h);

    if (!powered) return;

    // Header banner
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ACT ${s.fmcPage} 1/2`, 256, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    // Page-specific content
    if (s.fmcPage === 'RTE') {
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('ORIGIN', 40, 90);
      ctx.fillText('DEST', 400, 90);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('UUEE', 40, 120);
      ctx.fillText('ULLI', 400, 120);

      ctx.fillStyle = '#06b6d4';
      ctx.fillText('FLT NO', 40, 170);
      ctx.fillText('RUNWAY', 400, 170);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('AFL 738', 40, 200);
      ctx.fillText('RW26L', 400, 200);

      ctx.fillStyle = '#06b6d4';
      ctx.fillText('VIA / ROUTE', 40, 250);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DCT HONTO TIKTU DCT', 40, 280);
    } else if (s.fmcPage === 'PERF') {
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('ZFW', 40, 90);
      ctx.fillText('CRZ ALT', 400, 90);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('58.4 T', 40, 120);
      ctx.fillText('FL350', 400, 120);

      ctx.fillStyle = '#06b6d4';
      ctx.fillText('COST INDEX', 40, 170);
      ctx.fillText('RESERVES', 400, 170);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('35', 40, 200);
      ctx.fillText('2.8 T', 400, 200);

      ctx.fillStyle = '#06b6d4';
      ctx.fillText('V1 / VR / V2', 40, 250);
      ctx.fillStyle = '#22c55e';
      ctx.fillText('142 / 146 / 152', 40, 280);
    } else {
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('LEG', 40, 90);
      ctx.fillText('SPD/ALT', 380, 90);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HONTO', 40, 120);
      ctx.fillText('250/FL100', 380, 120);

      ctx.fillText('TIKTU', 40, 170);
      ctx.fillText('290/FL240', 380, 170);

      ctx.fillText('RW26L', 40, 220);
      ctx.fillText('145/2500', 380, 220);
    }

    // Function keys line at bottom
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('<INDEX', 40, 410);
    ctx.fillText('LEGS>', 420, 410);

    // Scratchpad bar at bottom
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(30, 445, 452, 40);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(30, 445, 452, 40);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(s.fmcScratchpad ? `> ${s.fmcScratchpad}_` : '> READY_', 45, 472);
  }
}
