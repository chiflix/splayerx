import syncStorage from '@/helpers/syncStorage';

function resolveBookmarks(files, bookmarks) {
  const data = syncStorage.getSync('bookmark');
  const temp = {};
  files.forEach((file, i) => {
    temp[file] = bookmarks[i];
  });
  syncStorage.setSync('bookmark', { ...data, ...temp });
}

export default {
  resolveBookmarks,
};
