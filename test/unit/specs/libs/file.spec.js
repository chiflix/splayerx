import { join } from 'path';
import { mkdir, readDir, checkPathExist, deleteDir } from '../../../../src/renderer/libs/file';

describe('file libs', () => {
  let path = '';
  beforeEach(async () => {
    path = join(__dirname, '__file_libs_test__');
  });

  it('mkdir return path with mediaHash', async () => {
    const result = await mkdir(path);
    expect(result).to.be.equal(path);
  });

  it('checkPathExist return true', async () => {
    const result = await checkPathExist(path);
    expect(result).to.be.equal(true);
  });

  it('readDir return []', async () => {
    const result = await readDir(path);
    expect(JSON.stringify(result)).to.be.equal(JSON.stringify([]));
  });

  it('deleteDir return true', async () => {
    const result = await deleteDir(path);
    expect(result).to.be.equal(true);
  });
});
