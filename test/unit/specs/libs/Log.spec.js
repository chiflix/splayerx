import Log from '../../../../src/renderer/libs/Log';

describe('Log module', () => {
  beforeEach(() => {
  });

  it('should successfully log info', () => {
    const log = new Log();
    log.info('JsonStorage', 'set subtitle style success');
  });

  it('should successfully log error string', () => {
    const log = new Log();
    log.error('JsonStorage', 'set subtitle style error');
  });
  it('should successfully log error', () => {
    const log = new Log();
    log.error('JsonStorage', new Error('error found'));
  });
});
