import React, { useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

import { logout } from '../../actions/auth';

const Logout = ({ logout }) => {
  useEffect(() => {
    logout();
  }, [logout]);

  return <Redirect to='/' />;
};

export default connect(
  null,
  { logout }
)(Logout);
