import store from '@/store';
import {
  FILE_NON_EXIST,
  EMPTY_FOLDER,
  OPEN_FAILED,
  ONLINE_LOADING,
  NOT_SUPPORTED_SUBTITLE,
  REQUEST_TIMEOUT,
  SUBTITLE_OFFLINE,
  SUBTITLE_UPLOAD,
  UPLOAD_SUCCESS,
  UPLOAD_FAILED,
  ADD_NO_VIDEO,
  LOCAL_SUBTITLE_REMOVED,
  SNAPSHOT_SUCCESS,
  SNAPSHOT_FAILED,
} from './notificationcodes';

export function addBubble(code, i18n) { // eslint-disable-line complexity
  switch (code) {
    case FILE_NON_EXIST:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.fileNonExist.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.fileNonExist.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
        cb: () => {
          this.$bus.$emit('delete-file');
        },
      });
      break;
    case ADD_NO_VIDEO:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.addNoVideo.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.addNoVideo.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case EMPTY_FOLDER:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.emptyFolder.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.emptyFolder.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case OPEN_FAILED:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.default.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.default.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case ONLINE_LOADING:
      store.dispatch('addMessages', {
        type: 'state',
        title: '',
        content: i18n.t('loading.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case SUBTITLE_OFFLINE:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.offLine.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.offLine.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case NOT_SUPPORTED_SUBTITLE:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.loadFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.loadFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case REQUEST_TIMEOUT:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.timeout.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.timeout.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case SUBTITLE_UPLOAD:
      store.dispatch('addMessages', {
        type: 'state',
        title: '',
        content: i18n.t('uploading.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case UPLOAD_SUCCESS:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('uploadingSuccess.title', i18n.locale, i18n.messages),
        content: i18n.t('uploadingSuccess.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case UPLOAD_FAILED:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('uploadingFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('uploadingFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case LOCAL_SUBTITLE_REMOVED:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('errorFile.localSubtitleRemoved.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.localSubtitleRemoved.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case SNAPSHOT_SUCCESS:
      store.dispatch('addMessages', {
        type: 'state',
        title: i18n.t('snapshotSuccess.title', i18n.locale, i18n.messages),
        content: i18n.t('snapshotSuccess.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case SNAPSHOT_FAILED:
      store.dispatch('addMessages', {
        type: 'result',
        title: i18n.t('snapshotFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('snapshotFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    default:
      break;
  }
}
const NotificationBubble = {};
NotificationBubble.install = (Vue, i18n) => {
  Vue.prototype.$addBubble = (code) => {
    addBubble(code, i18n);
  };
};
export default NotificationBubble;
