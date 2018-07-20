
import helpers from '@/helpers';

describe('Sagi.healthCheck', function () {
  it('Testing Sagi.healthCheck', function () {
    helpers.methods.sagi().healthCheck().then((status) => {
      expect(status).to.contain(1);
    });
  });
});
