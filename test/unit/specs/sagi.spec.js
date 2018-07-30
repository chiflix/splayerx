
import helpers from '@/helpers';

describe('helper.sagi api', function () {
  it('sagi.healthCheck should be 1', function (done) {
    helpers.methods.sagi().healthCheck().then((status) => {
      expect(status).to.equal(1);
      done();
    });
  });

  it('sagi.mediaTranslate should return OK', function (done) {
    helpers.methods.sagi().mediaTranslate('11-22-33-44').then((resp) => {
      // TODO: check correct response
      expect(resp.getError().toObject().code, 'error').to.equal(0);
      expect(resp.getError().toObject().message, 'error message').to.equal('OK');
      const res = resp.getResultsList();
      expect(res.length, 'results list length').to.be.above(1);
      done();
    }).catch((reason) => {
      // fail the test
      done(reason);
    });
  });
});
