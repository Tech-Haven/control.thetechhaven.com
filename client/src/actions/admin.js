import axios from 'axios';
import { LOAD_USERS_FROM_DB, ERROR } from './types';

export const loadUsersFromDb = () => async dispatch => {
  try {
    const res = await axios.get('api/db/users');

    dispatch({
      type: LOAD_USERS_FROM_DB,
      payload: res.data
    });
  } catch (err) {
    console.log(err);
    dispatch({
      type: ERROR
    });
  }
};
