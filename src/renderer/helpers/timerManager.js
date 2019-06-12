function timeValidator(time) {
  return typeof time === 'number' && !Number.isNaN(time) && Math.abs(time) !== Infinity && time >= 0;
}
class FakeTimer {
  /* eslint-disable no-underscore-dangle */
  constructor(time, timeLeft) {
    this.time = time;
    this._timeLeft = timeLeft === undefined ? this.time : timeLeft;
  }

  tick(time) {
    if (timeValidator(time)) {
      const timeLeft = this._timeLeft - time;
      this._timeLeft = timeLeft <= 0 ? 0 : timeLeft;
    }
  }

  timeLeft() {
    return this._timeLeft;
  }

  timeout() {
    return this._timeLeft <= 0 || this._timeLeft > this.time;
  }

  reset() {
    this._timeLeft = this.time;
  }
}

/**
 * Manager class to manage all FakeTimers.
 */
class FakeTimerManager {
  constructor() {
    this._timerQueue = new Map();
  }

  /**
   * Add a timer with provided name and time.
   * @param {string} name - Timer name to be added, return false if already has one.
   * @param {number} time - Time to tick, return false is not valid number.
   */
  addTimer(name, time) {
    if (timeValidator(time) && !this._timerQueue.has(name)) {
      this._timerQueue.set(name, new FakeTimer(time));
      return {
        name,
        time,
      };
    }
    return false;
  }

  /**
   * Remove a timer with provided name.
   * @param {string} name - name of timer to be removed, return false if no such timer.
   */
  removeTimer(name) {
    if (this._timerQueue.has(name)) {
      this._timerQueue.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Update a timer with new time value.
   * @param {string} name - Name of timer to be updated, return false if no such timer.
   * @param {number} newTime - New time to be updated, return false if invalid time.
   * @param {boolean} keepOldTime - Whether or not migrate old timeLeft to updated timer.
   */
  updateTimer(name, newTime, keepOldTime) {
    if (this._timerQueue.has(name) && timeValidator(newTime)) {
      this._timerQueue.set(
        name,
        keepOldTime
          ? new FakeTimer(newTime, this._timerQueue.get(name).timeLeft())
          : new FakeTimer(newTime, undefined),
      );
      return {
        name,
        newTime,
      };
    }
    return false;
  }

  /**
   * Get a timer's info if existed.
   * @param {string} name Name of timer to be updated, return null if no such timer.
   */
  getTimer(name) {
    if (this._timerQueue.has(name)) {
      return {
        name,
        timeLeft: this._timerQueue.get(name).timeLeft(),
      };
    }
    return null;
  }

  /**
   * Tick a timer for provided time.
   * @param {string} name - Name of the timer to be ticked, return false if no such timer.
   * @param {number} time - Time to tick, return false if invalid time.
   */
  tickTimer(name, time) {
    if (this._timerQueue.has(name) && timeValidator(time)) {
      this._timerQueue.get(name).tick(time);
      return this._timerQueue.get(name).timeLeft();
    }
    return null;
  }

  /**
   * Return current manager's timers' names.
   */
  timerList() {
    const timers = [];
    this._timerQueue.forEach((value, key) => {
      timers.push(key);
    });
    return timers;
  }

  /**
   * Return current timeout timers.
   */
  timeoutTimers() {
    const timers = [];
    this._timerQueue.forEach((value, key) => {
      if (value.timeout()) {
        timers.push(key);
      }
    });
    return timers;
  }

  /**
   * Reset all timeout timers.
   */
  resetTimeout() {
    const resetedTimers = [];
    this.timeoutTimers().forEach((value) => {
      this._timerQueue.get(value).reset();
      resetedTimers.push(value);
    });
    return resetedTimers;
  }
}

export default FakeTimerManager;
