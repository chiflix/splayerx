import sinon from 'sinon';
import TimerManager from '@/helpers/timerManager';

describe('Helper - TimerManager Unit Tests', () => {
  it('Sanity test', () => {
    expect(true).to.equal(true);
  });


  let sandbox;
  let manager;
  const name = 'testTimer';
  const time = 3000;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    manager = new TimerManager();
  });
  afterEach(() => {
    sandbox.restore();
    manager = null;
  });

  it('should new Timer be added', () => {
    expect(manager.addTimer(name, time)).to.deep.equal({ name, time });
  });
  it('should return false when add a already exist timer', () => {
    manager.addTimer(name, time);

    expect(manager.addTimer(name, time)).to.equal(false);
  });
  it('should return false when given an invalid time', () => {
    const invalidTimes = ['12', NaN, Infinity, -0.6];

    invalidTimes.forEach((invalidTime, index) => {
      expect(manager.addTimer(`${name}-${index}`, invalidTime)).to.equal(false);
    });
  });


  it('should existed timer be remvoed', () => {
    manager.addTimer(name, time);

    expect(manager.removeTimer(name)).to.equal(true);
  });
  it('should return false when remove a non-existed timer', () => {
    expect(manager.removeTimer('hhh')).to.equal(false);
  });

  it('should existed timer be updated', () => {
    manager.addTimer(name, time);
    const newTime = 4000;

    expect(manager.updateTimer(name, newTime)).to.deep.equal({ name, newTime });
  });
  it('should return false for non-existed timer', () => {
    manager.addTimer(name, time);

    expect(manager.updateTimer(`${name}-1`, time)).to.equal(false);
  });

  it('should existed timer be ticked', () => {
    manager.addTimer(name, time);
    const tickedTime = 2000;

    expect(manager.tickTimer(name, tickedTime)).to.equal(time - tickedTime);
  });
  it('should existed timer be ticked to zero', () => {
    manager.addTimer(name, time);
    const tickedTime = time + 1000;

    expect(manager.tickTimer(name, tickedTime)).to.equal(0);
  });

  it('should return null for invalid time', () => {
    manager.addTimer(name, time);
    const tickedTimes = ['12', NaN, Infinity, -0.6];

    tickedTimes.forEach((tickedTime) => {
      expect(manager.tickTimer(tickedTime)).to.equal(null);
    });
  });
  it('should return null for non-existed timer', () => {
    manager.addTimer(name, time);

    expect(manager.tickTimer(`${name}-1`)).to.equal(null);
  });

  it('should update timer save last timeLeft', () => {
    manager.addTimer(name, time);
    const tickedTime = time - 100;

    manager.tickTimer(name, tickedTime);
    manager.updateTimer(name, time - 100, true);

    expect(manager.tickTimer(name, 0)).to.equal(100);
  });

  it('should timer be get', () => {
    manager.addTimer(name, time);

    expect(manager.getTimer(name)).to.deep.equal({ name, timeLeft: time });
  });
  it('should return null for non-existed timer', () => {
    manager.addTimer(name, time);

    expect(manager.getTimer(`${name}-1`)).to.equal(null);
  });

  it('should timerList return all timers', () => {
    manager.addTimer(name, time);

    expect(manager.timerList()).to.deep.equal([name]);
  });

  it('should timeoutTimers return all timeout timers', () => {
    const indexed = 5;
    const timeoutIndex = 3;

    for (let i = 0; i < indexed; i += 1) {
      manager.addTimer(`${name}-${i}`, time);
    }
    manager.timerList().forEach((timer, index) => {
      manager.tickTimer(timer, index !== timeoutIndex ? time - 1 : time + 1);
    });

    expect(manager.timeoutTimers()).to.deep.equal([`${name}-${timeoutIndex}`]);
  });

  it('should reset timeoutTimers', () => {
    const indexed = 5;
    const timeoutIndex = 3;

    for (let i = 0; i < indexed; i += 1) {
      manager.addTimer(`${name}-${i}`, time);
    }
    manager.timerList().forEach((timer, index) => {
      manager.tickTimer(timer, index !== timeoutIndex ? time - 1 : time + 1);
    });

    expect(manager.resetTimeout()).to.deep.equal([`${name}-${timeoutIndex}`]);
  });
});
