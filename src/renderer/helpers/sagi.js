// these are fake api helper functions just for test functionality
// these will be replaced when grpc library is tested

class Sagi {
  constructor() {
    this.apiStatus = 1;
  }

  healthCheck() {
    // check sagi-api health, return UNKNOWN(0), SERVING(1) or XXXXX
    return new Promise((resolve) => {
      resolve(this.apiStatus);
    });
  }
}

export default new Sagi();
