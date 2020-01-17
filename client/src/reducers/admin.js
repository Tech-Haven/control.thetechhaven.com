import { LOAD_USERS_FROM_DB, ERROR } from '../actions/types';

const initialState = {
  loading: true,
  users: null
};

export default function(state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case LOAD_USERS_FROM_DB:
      return {
        ...state,
        loading: false,
        users: payload
      };
    case ERROR:
      return {
        ...state,
        loading: false,
        users: null
      };
    default:
      return state;
  }
}
