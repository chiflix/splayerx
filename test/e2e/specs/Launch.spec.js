import utils from '../utils';

describe('Launch', function () {
  beforeEach(utils.beforeEach);
  afterEach(utils.afterEach);

  it('shows the proper application title', function () {
    return this.app.client.getTitle()
      .then((title) => {
        console.log(title);
        expect(title).to.equal('SPlayerX');
      });
  });
});
