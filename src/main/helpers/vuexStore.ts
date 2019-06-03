import { MutationPayload, ActionPayload } from 'vuex';
import { WebContents } from 'electron';
// to-do: use real mutation/action type or typescriptened vuex
type MutationType = string;
type ActionType = string;

/**
 * @summary use vuex store in main process gracefully, in temporary
 * @description ⚠️for testing only, **DO NOT** import it in non-testing code
 */
export class MainVuex {
  webContents: undefined | WebContents;
  init(webContents: WebContents) { this.webContents = webContents; }
  commit(type: MutationType, payload: MutationPayload) {}
  dispatch(type: ActionType, payload: ActionPayload) {}
}

export const mainWindowVuex = new MainVuex();
