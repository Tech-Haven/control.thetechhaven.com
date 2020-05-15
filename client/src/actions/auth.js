import axios from 'axios';
import { USER_LOADED, AUTH_ERROR, LOGOUT, LOGIN } from './types';

export const loadUser = () => async dispatch => {
  try {
    const discordUser = await axios.get('api/discord/users/@me');
    const vpnDownload = await axios.get('api/lab/vpn');
    let data;
    console.log(vpnDownload)

    if (!vpnDownload.data || vpnDownload.data.error) {
      data = discordUser.data
    } else {
      data = Object.assign({}, discordUser.data, vpnDownload.data)
    }

    dispatch({
      type: USER_LOADED,
      payload: data
    });
  } catch (err) {
    console.log(err);
    dispatch({
      type: AUTH_ERROR
    });
  }
};

export const requestVPN = () => async dispatch => {
  const res = await axios.get('api/lab/vpn/create');
  dispatch({ type: requestVPN, payload: res.data })
}

export const logout = () => async dispatch => {
  await axios.get('api/discord/logout');
  dispatch({ type: LOGOUT });
};

export const login = () => async dispatch => {
  const res = await axios.get('api/discord/login');
  dispatch({ type: LOGIN, payload: res.data });
};
