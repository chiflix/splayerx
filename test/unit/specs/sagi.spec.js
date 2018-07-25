
import helpers from '@/helpers';

describe('helper.sagi api', function () {
  it('sagi.healthCheck should be 1', function (done) {
    helpers.methods.sagi().healthCheck().then((status) => {
      expect(status).to.equal(1);
      done();
    });
  });

  it('sagi.mediaTranslate should return 200 OK', function (done) {
    helpers.methods.sagi().mediaTranslate('11-22-33-44').then((resp) => {
      // TODO: check correct response
      expect(resp.getError().toObject().code).to.equal(200);
      expect(resp.getError().toObject().message).to.equal('OK');
      done();
    }).catch((reason) => {
      // TODO: fail the test
      console.log(reason);
      done();
    });
  });
});
