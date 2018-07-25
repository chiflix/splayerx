
import helpers from '@/helpers';

describe('helper.sagi api', function () {
  it('sagi.healthCheck should be 1', function (done) {
    helpers.methods.sagi().healthCheck().then((status) => {
      expect(status).to.equal(1);
      done();
    });
  });

  it('sagi.mediaTranslate should return', function (done) {
    helpers.methods.sagi().mediaTranslate('1-2-3-4').then((resp) => {
      // TODO: check correct response
      expect(resp.getError().toObject().code).to.equal(200);
      done();
    }).catch((reason) => {
      done(reason);
    });
  });
});
