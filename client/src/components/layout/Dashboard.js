import React, { Fragment } from 'react';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';

const Dashboard = ({ auth }) => {
  if (auth.loading) {
    return <Spinner />;
  }
  if (!auth.isAuthenticated) {
    return <Redirect to='/login' />;
  }
  return (
    <Fragment>
      <div className='profile-grid my-1'>
        <div className='profile-top bg-dark p-2'>
          <img
            src={`https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png`}
            className='round-img my-1'
            alt='avatar'
          />
          <h1>Welcome to the dashboard @{auth.user.username}</h1>
          <Link to='/logout' className='btn btn-light'>
            Logout
          </Link>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Dashboard);
