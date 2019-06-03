import { MainVuex } from 'main/helpers/vuexStore';
import { createSandbox, SinonSandbox } from 'sinon';
import { WebContents } from 'electron';

describe('vuex store unit tests', () => {
  let sandbox: SinonSandbox;
  let testMainVuex: MainVuex;
  let testWebContents: WebContents;

  beforeEach(() => {
    sandbox = createSandbox();
    testMainVuex = new MainVuex();
    testWebContents = new WebContents();
  });
  it('should init set the correct webContents');
  it('should send commit event when commit');
  it('should not send commit event when webContents not set');
  it('should send action event when dispatch');
  it('should not send action event when webContents not set');
});
