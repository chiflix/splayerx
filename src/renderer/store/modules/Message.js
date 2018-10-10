import winston from 'winston';
const state = {
  messages: [],
};
const getters = {
  messageInfo: state => state.messages,
};

const mutations = {
  addMessages(state, payload) {
    state.messages.push(payload);
  },
  removeMessages(state, id) {
    const logger = winston.createLogger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
    logger.log({
      level: 'error',
      title: state.messages.filter(m => m.id === id)[0].title,
      content: state.messages.filter(m => m.id === id)[0].content,
    });
    state.messages = state.messages.filter(m => m.id !== id);
  },
};
let i = 0;
const actions = {
  removeMessages({ commit }, id) {
    commit('removeMessages', id);
  },
  addMessages({ commit }, {
    type, title, content, dismissAfter,
  }) {
    i += 1;
    const id = i;
    commit('addMessages', {
      id, type, title, content, dismissAfter,
    });
    setTimeout(() => {
      commit('removeMessages', id);
    }, dismissAfter);
  },
};
export default {
  state,
  getters,
  actions,
  mutations,
};
