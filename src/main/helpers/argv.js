import { getValidVideoExtensions } from '../../shared/utils';

export function getOpenedFile(argv) {
  let args = [...argv];
  if (!process.isPackaged) { // See https://github.com/electron/electron/issues/4690
    args = args.slice(1);
  }
  if (args.length && getValidVideoExtensions().test(args[args.length - 1])) {
    return args[args.length - 1];
  }
  return null;
}

export default {
  getOpenedFile,
};
