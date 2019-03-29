import path from 'path';
import syncStorage from '@/helpers/syncStorage';

function resolveBookmarks(files, bookmarks) {
  const data = syncStorage.getSync('bookmark');
  const filePaths = Object.keys(data);
  const temp = {};
  files.forEach((file, index) => {
    const relativePath = path.relative(filePaths[0], file);
  });
  syncStorage.setSync('bookmark', { ...data, ...temp });
}

export default {
  resolveBookmarks,
};
