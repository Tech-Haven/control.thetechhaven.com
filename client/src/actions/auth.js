import axios from 'axios';
import { USER_LOADED, AUTH_ERROR, LOGOUT, LOGIN } from './types';

export const loadUser = () => async (dispatch) => {
  try {
    const discordUser = await axios.get('api/discord/users/@me');
    let data = discordUser.data;

    dispatch({
      type: USER_LOADED,
      payload: data,
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};

export const logout = () => async (dispatch) => {
  try {
    await axios.get('api/discord/logout');
    dispatch({ type: LOGOUT });
  } catch (error) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};

export const login = () => async (dispatch) => {
  try {
    const res = await axios.get('api/discord/login');
    dispatch({ type: LOGIN, payload: res.data });
  } catch (error) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};
