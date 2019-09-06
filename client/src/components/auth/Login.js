import React, { useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';

import { login } from '../../actions/auth';

const Login = ({ getLogin, isAuthenticated, loading, authURI }) => {
  useEffect(() => {
    getLogin();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (isAuthenticated) {
    return <Redirect to='/dashboard' />;
  }

  if (authURI) {
    console.log(authURI);
    const { CLIENT_ID, SCOPE, REDIRECT_URI } = authURI;
    window.location = `https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=${SCOPE}&response_type=code&redirect_uri=${REDIRECT_URI}`;
  }

  return `Redirecting to Discord Login`;
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  loading: state.auth.loading,
  authURI: state.auth.authURI
});

const mapDispatchToProps = {
  getLogin: login
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
