import axios from 'axios';
import download from 'downloadjs';
import { USER_LOADED, AUTH_ERROR, LOGOUT, LOGIN } from './types';

const VAULT_TOKEN = process.env.REACT_APP_VAULT_TOKEN;

export const loadUser = () => async (dispatch) => {
  try {
    const discordUser = await axios.get('api/discord/users/@me');
    let data = discordUser.data;

    try {
      // Get id and secret from Vault
      const vaultRes = await axios({
        method: 'get',
        url: `api/v1/vault/secrets/${data.id}`,
        headers: {
          'X-Vault-Token': VAULT_TOKEN,
        },
      });

      const {
        application_credential_id,
        application_credential_secret,
      } = vaultRes.data.data;

      // Request token
      const tokenRes = await axios({
        method: 'post',
        url: `api/v1/openstack/auth/tokens`,
        data: {
          id: application_credential_id,
          secret: application_credential_secret,
        },
      });
      data.xAuthToken = tokenRes.headers['x-subject-token'];
    } catch (error) {
      // User doesn't have a lab account, do nothing
    }

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

export const downloadVpn = (xAuthToken) => async (dispatch) => {
  try {
    const r = await axios({
      method: 'get',
      url: `api/v1/download`,
      headers: {
        'X-Auth-Token': xAuthToken,
      },
    });
    download(r.data, 'techhavenlab.ovpn');
    dispatch();
  } catch (error) {
    // TODO: Error handle couldn't download VPN
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
