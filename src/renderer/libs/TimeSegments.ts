import { ITimeSegments, IVideoSegments } from '@/interfaces/ISubtitle';

/** basic time segments, used to check whether a given time is in range */
export class StreamTimeSegments implements ITimeSegments {
  private startTimestamps: number[] = [];

  private endTimestamps: number[] = [];

  private isValidTimestamp(num: number) {
    return typeof num === 'number' && Number.isFinite(num) && !Number.isNaN(num) && num >= 0;
  }

  /** also return the index for insertion use */
  private checkWithIndex(time: number) {
    const index = this.startTimestamps.findIndex((timestamp, index, arr) => (
      timestamp <= time && (!arr[index + 1] || arr[index + 1] >= time)
    ));
    return {
      in: index !== -1 && this.endTimestamps[index] >= time,
      index,
    };
  }

  public check(time: number) { return this.checkWithIndex(time).in; }

  public insert(start: number, end: number) {
    if (this.isValidTimestamp(start) && this.isValidTimestamp(end) && start !== end) {
      const [startTime, endTime] = [start, end].sort();
      const { in: startIn, index: startIndex } = this.checkWithIndex(startTime);
      const { in: endIn, index: endIndex } = this.checkWithIndex(endTime);

      if (!startIn && !endIn && startIndex === endIndex) {
        this.startTimestamps.splice(startIndex + 1, 0, startTime);
        this.endTimestamps.splice(endIndex + 1, 0, endTime);
      } else {
        if (!startIn) this.startTimestamps[startIndex + 1] = startTime;
        this.endTimestamps[startIn ? startIndex : endIndex] = endIn
          ? this.endTimestamps[endIndex] : end;

        const deleteIndex = startIndex === endIndex ? 0 : startIndex + 1;
        const deleteCount = endIndex - startIndex - (startIn ? 0 : 1);
        this.startTimestamps.splice(deleteIndex, deleteCount);
        this.endTimestamps.splice(deleteIndex, deleteCount);
      }
    }
  }

  /**
   * Seperate insertions can be problematic because there
   * are margins between different segments.
   * Since subtitles are bulk retrieved, why not bulk insert segments?
   * @param segments time segments
   * @param time current video time, because subtitle start may be later than video time.
   */
  public bulkInsert(segments: [number, number][], time: number) {
    const allTimeStamps = segments.flatMap(nums => nums)
      .concat([time])
      .filter(num => this.isValidTimestamp(num));
    this.insert(Math.min(...allTimeStamps), Math.max(...allTimeStamps));
  }
}
/** time segments with played time support */
export class VideoTimeSegments implements IVideoSegments {
  /** video's duration (also the highest number in timestamps) */
  private duration: number = 0;

  private timestamps: number[] = [];

  private played: boolean[] = [];

  public constructor(duration: number) {
    if (!this.isValidTimestamp(duration)) throw new Error('Duration should be a valid number.');
    this.duration = duration;
    this.timestamps.push(0, this.duration);
    this.played.push(false);
  }

  private isValidTimestamp(num: number) {
    return typeof num === 'number' && Number.isFinite(num) && !Number.isNaN(num) && num > 0
      && (!this.duration || (this.duration && num <= this.duration));
  }

  public insert(start: number, end: number) {
    if (this.isValidTimestamp(start) && this.isValidTimestamp(end)) {
      start = Math.min(start, end);
      const result = this.checkWithIndex(start);
      if (result.in && this.timestamps[result.index] !== start) {
        this.timestamps.splice(result.index + 1, 0, start);
        this.played.splice(result.index + 1, 0, false);
      }
    }
  }

  /** also return the index for insertion use */
  private checkWithIndex(time: number) {
    const index = this.timestamps.findIndex((timestamp, index, arr) => (
      timestamp <= time && (!arr[index + 1] || arr[index + 1] > time)
    ));
    const lastTimeStamp = this.timestamps[this.timestamps.length - 1];
    return {
      in: index !== -1 && lastTimeStamp >= time,
      index,
    };
  }

  /** useless (because almost every timestamp is in range) */
  public check(time: number) { return this.checkWithIndex(time).in; }

  private lastIndex: number = -1;

  private lastPlayedTime: number = 0;

  public updatePlayed(timeStamp: number, lastTimeStamp: number = 0) {
    if (this.isValidTimestamp(timeStamp) && this.isValidTimestamp(lastTimeStamp)) {
      [timeStamp, lastTimeStamp] = [
        Math.max(timeStamp, lastTimeStamp),
        Math.min(timeStamp, lastTimeStamp),
      ];
      const { in: currentIn, index: currentIndex } = this.checkWithIndex(timeStamp);
      const { in: lastIn, index: lastIndex } = this.checkWithIndex(lastTimeStamp);
      if (currentIn && lastIn && !this.played[currentIndex]) {
        let playedTime = timeStamp - lastTimeStamp;
        // played time should be in the same segment
        if (lastIndex !== currentIndex) playedTime = timeStamp - this.timestamps[currentIndex];
        if (this.lastIndex !== currentIndex) {
          this.lastIndex = currentIndex;
          this.lastPlayedTime = playedTime;
        } else {
          this.lastPlayedTime += playedTime;
        }
      }
      if (this.lastIndex !== -1) {
        const segmentTime = this.timestamps[this.lastIndex + 1] - this.timestamps[this.lastIndex];
        if (this.lastPlayedTime / segmentTime >= 0.9) this.played[this.lastIndex] = true;
      }
    }
  }

  public get playedTime() {
    return this.played
      .map((played, index) => ({ played, index }))
      .filter(({ played }) => played)
      .reduce((playedTime, { index }) => {
        playedTime += this.timestamps[index + 1] - this.timestamps[index];
        return playedTime;
      }, 0);
  }

  public export() {
    return this.played
      .map((played, index) => ({
        start: this.timestamps[index],
        end: this.timestamps[index + 1],
        played,
      }));
  }

  public restore(timeSegments: { start: number, end: number, played: boolean }[]) {
    this.timestamps = timeSegments.map(({ start }) => start);
    this.timestamps.push(timeSegments[timeSegments.length - 1].end);
    this.played = timeSegments.map(({ played }) => played);
  }
}
