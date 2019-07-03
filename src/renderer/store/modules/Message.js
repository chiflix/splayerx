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
  removeMessages(state, id) {
    state.messages = state.messages.filter(m => m.id !== id);
  },
};
const actions = {
  removeMessages({ commit }, id) {
    commit('removeMessages', id);
  },
  addMessages({ commit }, {
    id, type, title, content, dismissAfter, cb,
  }) {
    if (id) {
      commit('removeMessages', id);
    } else {
      id = `${Date.now()}-${Math.random()}`;
    }

    commit('addMessages', {
      id, type, title, content, dismissAfter,
    });
    if (dismissAfter) {
      setTimeout(() => {
        commit('removeMessages', id);
        if (cb) {
          cb();
        }
      }, dismissAfter);
    }
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
