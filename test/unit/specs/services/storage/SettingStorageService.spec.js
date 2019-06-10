import sinon from 'sinon';
import SettingStorageService from '../../../../../src/renderer/services/storage/SettingStorageService';
import JStorage from '../../../../../src/renderer/libs/JStorage';

describe('SettingStorageService logic service', () => {
  let settingStorageService;
  const subStyleDemo = {
    chosenStyle: 'abc',
    chosenSize: 32,
    enabledSecondarySub: false,
  };
  const playStatesDemo = {
    volume: 60,
    muted: false,
  };

  afterEach(() => {
    sinon.restore();
  });
  it('should successfully updateSubtitleStyle', async () => {
    sinon.stub(JStorage.prototype, 'get').callsFake(() => subStyleDemo);
    sinon.stub(JStorage.prototype, 'set').callsFake(() => true);
    const jStorage = new JStorage();
    settingStorageService = new SettingStorageService(jStorage);
    let r = false;
    try {
      r = await settingStorageService.updateSubtitleStyle(subStyleDemo);
    } catch (error) {
      r = false;
    }
    expect(r).to.be.equal(true);
  });

  it('should successfully updatePlaybackStates', async () => {
    sinon.stub(JStorage.prototype, 'get').callsFake(() => playStatesDemo);
    sinon.stub(JStorage.prototype, 'set').callsFake(() => true);
    const jStorage = new JStorage();
    settingStorageService = new SettingStorageService(jStorage);
    let r = false;
    try {
      r = await settingStorageService.updatePlaybackStates(playStatesDemo);
    } catch (error) {
      r = false;
    }
    expect(r).to.be.equal(true);
  });

  it('should fail updateSubtitleStyle when throw error', async () => {
    sinon.stub(JStorage.prototype, 'get').callsFake(() => subStyleDemo);
    sinon.stub(JStorage.prototype, 'set').callsFake(() => throw new Error());
    const jStorage = new JStorage();
    settingStorageService = new SettingStorageService(jStorage);
    let r = false;
    try {
      r = await settingStorageService.updateSubtitleStyle(subStyleDemo);
    } catch (error) {
      r = false;
    }
    expect(r).to.be.equal(false);
  });

  it('should successfully updatePlaybackStates', async () => {
    sinon.stub(JStorage.prototype, 'get').callsFake(() => subStyleDemo);
    sinon.stub(JStorage.prototype, 'set').callsFake(() => throw new Error());
    const jStorage = new JStorage();
    settingStorageService = new SettingStorageService(jStorage);
    let r = false;
    try {
      r = await settingStorageService.updatePlaybackStates(playStatesDemo);
    } catch (error) {
      r = false;
    }
    expect(r).to.be.equal(false);
  });
});
