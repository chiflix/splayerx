export default {
  methods: {
    timecodeFromSeconds(s) {
      const dt = new Date(Math.abs(s) * 1000);
      let hours = dt.getUTCHours();
      let minutes = dt.getUTCMinutes();
      let seconds = dt.getUTCSeconds();

      // the above dt.get...() functions return a single digit
      // so I prepend the zero here when needed
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      if (hours > 0) {
        if (hours < 10) {
          hours = `${hours}`;
        }
        if (s < 0) {
          return `-${hours}:${minutes}:${seconds}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      if (s < 0) {
        return `-${minutes}:${seconds}`;
      }
      return `${minutes}:${seconds}`;
    },
  },
};
