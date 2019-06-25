import Log from '../../../../src/renderer/libs/Log';

describe('Log module', () => {
  let log;
  beforeEach(() => {
    log = new Log();
  });

  it('should successfully log info', () => {
    log.info('JsonStorage', 'set subtitle style success');
  });

  it('should successfully log error string', () => {
    log.error('JsonStorage', 'set subtitle style error');
  });
  it('should successfully log error', () => {
    log.error('JsonStorage', new Error('error found'));
  });
});
