import axios from 'axios';
import { USER_LOADED, AUTH_ERROR, LOGOUT, LOGIN } from './types';

export const loadUser = () => async dispatch => {
  try {
    const res = await axios.get('api/discord/users/@me');

    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    console.log(err);
    dispatch({
      type: AUTH_ERROR
    });
  }
};

export const logout = () => async dispatch => {
  await axios.get('api/discord/logout');
  dispatch({ type: LOGOUT });
};

export const login = () => async dispatch => {
  const res = await axios.get('api/discord/login');
  dispatch({ type: LOGIN, payload: res.data });
};
