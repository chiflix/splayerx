/* eslint-disable default-case */
import { EventEmitter } from 'events';
import { ipcRenderer } from 'electron';
import {
  WHEEL_SCROLL_TOUCH_BEGIN_PHASE as touchBegin,
  WHEEL_SCROLLING_PHASE as scrolling,
  WHEEL_SCROLL_TOUCH_END_PHASE as touchEnd,
  WHEEL_INERTIAL_SCROLLING_PHASE as inertial,
  WHEEL_STOPPED_PHASE as stopped,
} from '../constants';
// eslint-disable-next-line import/no-webpack-loader-syntax
const Lethargy = require('exports-loader?this.Lethargy!lethargy/lethargy');

class WheelPhaseCalculator extends EventEmitter {
  wheelScrollingTimer = 0;
  wheelInertialingTimer = 0;

  touchBeginPhase = touchBegin;
  scrollingPhase = scrolling;
  touchEndPhase = touchEnd;
  inertialPhase = inertial;
  stoppedPhase = stopped;

  _lastPhase = this.stoppedPhase;
  _availableLastPhases = [
    this.scrollingPhase,
    this.inertialPhase,
    this.stoppedPhase,
  ];
  _availablePhases = [
    this.scrollingPhase,
    this.inertialPhase,
    this.stoppedPhase,
  ];
  get lastPhase() { return this._lastPhase; }
  set lastPhase(phase) {
    if (phase !== this._lastPhase && this._availableLastPhases.includes(phase)) {
      this._lastPhase = phase;
      if (this._availablePhases.includes(phase)) this.emit('phase-change', phase);
    }
  }

  interval = 200;
  constructor(interval) {
    super();
    if (interval) this.interval = interval;
  }

  calculate(event) {
    this.lastPhase = event ? this.scrollingPhase : this.inertialPhase;
  }
}

class LethargyWheel extends WheelPhaseCalculator {
  // https://github.com/d4nyll/lethargy
  // ╔═════════╦═══════════╦═════════════╦═══════════╗
  // ║         ║ stability ║ sensitivity ║ tolerance ║
  // ╠═════════╬═══════════╬═════════════╬═══════════╣
  // ║  range  ║    5-30   ║    0-120    ║  0.05-0.3 ║
  // ╠═════════╬═══════════╬═════════════╬═══════════╣
  // ║ default ║     8     ║     100     ║    0.1    ║
  // ╠═════════╬═══════════╬═════════════╬═══════════╣
  // ║ current ║     8     ║     100     ║    0.1    ║
  // ╚═════════╩═══════════╩═════════════╩═══════════╝
  lethargy = new Lethargy();
  constructor({
    stability,
    sensitivity,
    tolerance,
    interval,
  } = {
    stability: 8,
    sensitivity: 100,
    tolerance: 0.1,
    interval: 200,
  }) {
    super(interval);
    this.lethargy = new Lethargy(
      stability || 8,
      sensitivity || 100,
      tolerance || 0.1,
    );
  }
  calculate(event) {
    if (this.lethargy.check(event)) {
      // It's scrolling phase now
      if (this.wheelInertialingTimer) clearTimeout(this.wheelInertialingTimer);
      clearTimeout(this.wheelScrollingTimer);
      this.wheelScrollingTimer = setTimeout(() => {
        this.lastPhase = this.stoppedPhase;
        this.wheelScrollingTimer = 0;
      }, this.interval);
      this.lastPhase = this.scrollingPhase;
    } else if (
      this.lastPhase === this.scrollingPhase ||
      this.lastPhase === this.inertialPhase
    ) {
      // ... or it's inertialing phase now.
      if (this.wheelScrollingTimer) clearTimeout(this.wheelScrollingTimer);
      clearTimeout(this.wheelInertialingTimer);
      this.wheelInertialingTimer = setTimeout(() => {
        this.lastPhase = this.stoppedPhase;
        this.wheelInertialingTimer = 0;
      }, this.interval);
      this.lastPhase = this.inertialPhase;
    }
  }
}
// when you update the value here, remember to update the table above
export const lethargyWheel = new LethargyWheel();

class ElectronWheel extends WheelPhaseCalculator {
  _availableLastPhases = this._availablePhases.concat([
    this.touchBeginPhase,
    this.touchEndPhase,
  ]);

  constructor(interval) {
    super(interval);

    ipcRenderer.on('scroll-touch-begin', () => { this.lastPhase = this.touchBeginPhase; });
    ipcRenderer.on('scroll-touch-end', () => { this.lastPhase = this.touchEndPhase; });
  }

  calculate(event) {
    if (event) {
      clearTimeout(this.wheelScrollingTimer);
      /* eslint-disable no-default-case */
      switch (this.lastPhase) {
        case this.touchBeginPhase:
          this.lastPhase = this.scrollingPhase;
          break;
        case this.touchEndPhase:
          this.lastPhase = this.inertialPhase;
          break;
      }
      /* eslint-disable no-default-case */
      this.wheelScrollingTimer = setTimeout(() => {
        this.lastPhase = this.stoppedPhase;
      }, this.interval);
    }
  }
}
export const electronWheel = new ElectronWheel();
