
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore

import { Audio as m } from '@/store/mutationTypes';
import { Audio as a } from '@/store/actionTypes';
import { Stream, CodecType } from '@/plugins/mediaTasks/mediaInfoQueue';

type AudioState = {
  streams: [],
}

const state = {
  streams: [],
};

const getters = {
  audioStreams(state: AudioState) {
    return state.streams;
  },
};

const mutations = {
  [m.UPDATE_AUDIO_STREAMS](state: AudioState, streams: []) {
    state.streams = streams;
  },
};

const actions = {
  [a.UPDATE_AUDIO_STREAMS]({
    commit,
  }: any, streams: Stream[]) {
    const st = streams.filter((e: Stream) => e.codecType === CodecType.Audio);
    commit(m.UPDATE_AUDIO_STREAMS, st);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
