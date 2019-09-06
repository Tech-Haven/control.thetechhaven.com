import { USER_LOADED, AUTH_ERROR, LOGOUT, LOGIN } from '../actions/types';

const initialState = {
  isAuthenticated: null,
  loading: true,
  authURI: null,
  user: null
};

export default function(state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload
      };
    case LOGIN:
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        authURI: payload
      };
    case AUTH_ERROR:
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        authURI: null,
        user: null
      };
    default:
      return state;
  }
}
