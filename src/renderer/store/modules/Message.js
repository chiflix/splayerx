const state = {
  messages: [],
};
const getters = {
  messageInfo: state => state.messages,
};

const mutations = {
  addMessages(state, payload) {
    if (state.messages.length === 3) {
      state.messages.splice(0, 1);
    }
    state.messages.push(payload);
  },
  changeMessageState(state, payload) {
    const message = state.messages.find(m => m.id === payload.id);
    if (message) message[payload.property] = payload.value;
  },
  removeMessages(state, id) {
    state.messages = state.messages.filter(m => m.id !== id);
  },
};

const timeouts = {};

const actions = {
  removeMessages({ commit }, id) {
    commit('removeMessages', id);
  },
  changeMessageState({ commit }, payload) {
    commit('changeMessageState', payload);
  },
  addMessages({ commit }, payload) {
    if (payload.id) {
      commit('removeMessages', payload.id);
      clearTimeout(timeouts[payload.id]);
      delete timeouts[payload.id];
    } else {
      payload.id = `${Date.now()}-${Math.random()}`;
    }

    commit('addMessages', payload);
    if (payload.dismissAfter) {
      timeouts[payload.id] = setTimeout(() => {
        commit('removeMessages', payload.id);
        delete timeouts[payload.id];
        if (payload.cb) payload.cb();
      }, payload.dismissAfter);
    }
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
