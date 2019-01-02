
import Sagi from '@/helpers/sagi';

describe('helper.sagi api', () => {
  it('sagi.healthCheck should be 1', (done) => {
    Sagi.healthCheck().then((status) => {
      expect(status).to.equal(1);
      done();
    }).catch((reason) => {
      // fail the test
      done(reason);
    });
  }).timeout(20000);

  it('sagi.mediaTranslateRaw should return OK', (done) => {
    Sagi.mediaTranslateRaw('11-22-33-44').then((resp) => {
      if (process.env.NODE_ENV === 'production') {
        expect(resp.getError().toObject().code, 'error').to.equal(5); // no result
        done();
        return;
      }
      // TODO: check correct response
      expect(resp.getError().toObject().code, 'error').to.equal(0);
      expect(resp.getError().toObject().message, 'error message').to.equal('OK');
      const res = resp.getResultsList();
      expect(res.length, 'results list length').to.be.above(0);
      done();
    }).catch((reason) => {
      // fail the test
      done(reason);
    });
  }).timeout(20000);

  it('sagi.training should able to push transcripts', (done) => {
    function randstr() {
      return Math.random().toString(36).substring(7);
    }
    // generate random transcript data for unexist media hash
    const randomMediahash = `${randstr()}-${randstr()}-${randstr()}-${randstr()}`;
    console.log(randomMediahash);
    const payloadText = `this is a playload sample ${randstr()}`;
    const payloadSample = `1\n00:00:00,440 --> 00:02:20,375\n${payloadText}`;

    const transcriptData = {
      media_identity: randomMediahash,
      language_code: 'zh',
      format: 'srt',
      played_time: 80,
      total_time: 100,
      delay: 0,
      payload: Buffer.from(payloadSample),
    };
    Sagi.pushTranscript(transcriptData).then((resp) => {
      if (process.env.NODE_ENV === 'production') {
        expect(resp.getError().toObject().code, 'error').to.equal(5); // no result
        done();
        return;
      }
      expect(resp.toObject().code, 'error').to.equal(0);

      // try to fetch the transcript that we just pushed
      Sagi.mediaTranslateRaw(randomMediahash).then((resp) => {
        expect(resp.getError().toObject().code, 'error').to.equal(0);
        const res = resp.getResultsList();
        expect(res.length, 'results list length').to.be.above(0);
        console.log(`results list length ${res.length}`);

        res.forEach((tr) => {
          Sagi.getTranscriptRaw(tr.getTranscriptIdentity()).then((resp) => {
            expect(resp.hasError()).to.be.equal(false);

            const cue0 = resp.getTranscriptsList()[0];
            if (cue0.getText() === payloadText) {
              done();
            }
            console.log(cue0.getText());
          }).catch((reason) => {
            // fail the test
            done(reason);
          });
        });
      }).catch((reason) => {
        // fail the test
        done(reason);
      });
    }).catch((reason) => {
      // fail the test
      done(reason);
    });
  }).timeout(20000);
});
