import { HealthCheckResponse } from 'sagi-api/health/v1/health_pb';
import Sagi from '@/libs/sagi';

describe('helper.sagi api', () => {
  it('sagi.healthCheck should be Serving', (done) => {
    Sagi.healthCheck().then(({ status }) => {
      expect(status).to.equal(HealthCheckResponse.ServingStatus.SERVING);
      done();
    }).catch(done);
  }).timeout(20000);
});
