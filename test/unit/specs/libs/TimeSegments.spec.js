import { StreamTimeSegments, VideoTimeSegments } from '@/libs/TimeSegments';

describe('StreamTimeSegments', () => {
  let timeSeg = new StreamTimeSegments();
  beforeEach(() => {
    timeSeg = new StreamTimeSegments();
    timeSeg.startTimestamps = [1, 3, 5];
    timeSeg.endTimestamps = [2, 4, 6];
  });

  describe('checkWithIndex', () => {
    it('should return false and -1 when time is lower than the minimum', () => {
      const result = timeSeg.checkWithIndex(0.5);

      expect(result).to.deep.equal({ in: false, index: -1 });
    });

    it('should return true and index when time in range', () => {
      const result = timeSeg.checkWithIndex(1.5);

      expect(result).to.deep.equal({ in: true, index: 0 });
    });

    it('should return false and index when time is not in range', () => {
      const result = timeSeg.checkWithIndex(4.5);

      expect(result).to.deep.equal({ in: false, index: 1 });
    });
  });

  describe('insert', () => {
    it('start in range, end in range, start index and end index are equal', () => {
      timeSeg.insert(1.25, 1.75);

      expect(timeSeg.startTimestamps).to.deep.equal([1, 3, 5]);
      expect(timeSeg.endTimestamps).to.deep.equal([2, 4, 6]);
    });
    it('start in range, end not in range, start index and end index are equal', () => {
      timeSeg.insert(1.5, 2.5);

      expect(timeSeg.startTimestamps).to.deep.equal([1, 3, 5]);
      expect(timeSeg.endTimestamps).to.deep.equal([2.5, 4, 6]);
    });
    it('should ignore two same numbers', () => {
      timeSeg.insert(1, 1);

      expect(timeSeg.startTimestamps).to.deep.equal([1, 3, 5]);
      expect(timeSeg.endTimestamps).to.deep.equal([2, 4, 6]);
    });
  });
});
describe('VideoTimeSegments', () => {
  let timeSeg = new VideoTimeSegments(10);
  beforeEach(() => {
    timeSeg = new VideoTimeSegments(10);
    timeSeg.timestamps = [0, 2, 4, 6, 8, 10];
    timeSeg.played = [false, false, false, false, false];
  });

  describe('checkWithIndex', () => {
    it('should return false and -1 when time is lower than the minimum', () => {
      const result = timeSeg.checkWithIndex(-1);

      expect(result).to.deep.equal({ in: false, index: -1 });
    });

    it('should return true and index when time in range', () => {
      const result = timeSeg.checkWithIndex(4);

      expect(result).to.deep.equal({ in: true, index: 2 });
    });

    it('should return false and index when time is larger than the maximum', () => {
      const result = timeSeg.checkWithIndex(11);

      expect(result).to.deep.equal({ in: false, index: 5 });
    });
  });

  describe('insert', () => {
    it('should insert a new entry in timestamps', () => {
      timeSeg.insert(5, 5.5);

      expect(timeSeg.timestamps).to.deep.equal([0, 2, 4, 5, 6, 8, 10]);
    });
    it('should insert the minimum as a new entry', () => {
      timeSeg.insert(5.5, 5);

      expect(timeSeg.timestamps).to.deep.equal([0, 2, 4, 5, 6, 8, 10]);
    });
    it('should not insert an existed entry', () => {
      timeSeg.insert(4, 7);

      expect(timeSeg.timestamps).to.deep.equal([0, 2, 4, 6, 8, 10]);
    });
    it('should also insert a false entry in played', () => {
      timeSeg.insert(5, 5.5);

      expect(timeSeg.played).to.deep.equal([false, false, false, false, false, false]);
    });
    it('should keep previous segment played status when break entries', () => {
      timeSeg.played = [false, false, true, false, false];
      timeSeg.insert(5, 5.5);

      expect(timeSeg.played).to.deep.equal([false, false, true, false, false, false]);
    });
  });

  describe('updatePlayed', () => {
    describe('update last index and last played time', () => {
      describe('when current and last timestamp are in the same time segment', () => {
        it('should update last index to the segment index', () => {
          timeSeg.updatePlayed(5, 4);

          expect(timeSeg.lastIndex).to.equal(2);
        });
        it('should update last played time += the contraction of two timestamps', () => {
          timeSeg.updatePlayed(5, 4);

          expect(timeSeg.lastPlayedTime).to.equal(1);
        });
      });
      describe('when current and last timestamp are not in the same time segment', () => {
        it('should update last index to the timestamp segment index', () => {
          timeSeg.updatePlayed(7.5, 4);

          expect(timeSeg.lastIndex).to.equal(3);
        });
        it('should update last played += the contraction of the timestamp and the segment start', () => {
          timeSeg.updatePlayed(7.5, 4);

          expect(timeSeg.lastPlayedTime).to.equal(1.5);
        });
      });
    });

    it('should not update played when time played not reaching 90% of the segment time', () => {
      timeSeg.updatePlayed(5, 4);

      expect(timeSeg.played).to.deep.equal([false, false, false, false, false]);
    });

    it('should update played to true when time played reaching 90% of the segment time', () => {
      timeSeg.updatePlayed(5.9, 4);

      expect(timeSeg.played).to.deep.equal([false, false, true, false, false]);
    });
  });

  it('should played time return proper played time', () => {
    timeSeg.played = [true, false, true, false, true];

    expect(timeSeg.playedTime).to.deep.equal(6);
  });

  it('should export return raw time segments', () => {
    timeSeg.played[2] = true;
    const result = timeSeg.export();
    const expectedResult = [
      { start: 0, end: 2, played: false },
      { start: 2, end: 4, played: false },
      { start: 4, end: 6, played: true },
      { start: 6, end: 8, played: false },
      { start: 8, end: 10, played: false },
    ];

    expect(result).to.deep.equal(expectedResult);
  });

  describe('restore', () => {
    const rawTimeSegments = [
      { start: 0, end: 2, played: false },
      { start: 2, end: 4, played: false },
      { start: 4, end: 6, played: true },
      { start: 6, end: 8, played: false },
      { start: 8, end: 10, played: true },
      { start: 10, end: 12, played: true },
    ];
    it('should update time segments', () => {
      timeSeg = new VideoTimeSegments(12);
      timeSeg.restore(rawTimeSegments);
      const expectedResult = [0, 2, 4, 6, 8, 10, 12];

      expect(timeSeg.timestamps).to.deep.equal(expectedResult);
    });
    it('should update played', () => {
      timeSeg = new VideoTimeSegments(12);
      timeSeg.restore(rawTimeSegments);
      const expectedResult = [false, false, true, false, true, true];

      expect(timeSeg.played).to.deep.equal(expectedResult);
    });
  });
});
