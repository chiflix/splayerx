import bookmark from '@/helpers/bookmark';
import syncStorage from '@/helpers/syncStorage';

describe('bookmark', () => {
  const data = {
    '/path/1/2/4': 'bookmark1',
    '/path/1/3/2': 'bookmark2',
  };
  beforeEach(() => {
    syncStorage.setSync('bookmark', data);
  });
  it('resolveBookmarks', () => {
    const files = ['/path/1/2/3/4.mp4'];
    const bookmarks = ['bookmark3'];
    bookmark.resolveBookmarks(files, bookmarks);

    const data = syncStorage.getSync('bookmark');
    expect(data).deep.equal({
      '/path/1/2/4': 'bookmark1',
      '/path/1/3/2': 'bookmark2',
      '/path/1/2/3/4.mp4': 'bookmark3',
    });
  });
  // it('resolveBookmarks can replace the child files', () => {
  //   const files = ['/path/1/2'];
  //   const bookmarks = ['bookmark4'];
  //   bookmark.resolveBookmarks(files, bookmarks);

  //   const data = syncStorage.getSync('bookmark');
  //   expect(data).deep.equal({
  //     '/path/1/2': 'bookmark4',
  //     '/path/1/3/2': 'bookmark2',
  //   });
  // });
});
