import React, { Fragment } from 'react';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';

import { requestVPN } from '../../actions/auth'

const Dashboard = ({ getRequestVPN, auth }) => {
  if (auth.loading) {
    return <Spinner />;
  }
  if (!auth.isAuthenticated) {
    return <Redirect to='/login' />;
  }

  const adminLink = (
    <Link to='/admin' className='btn'>
      Admin Panel
    </Link>
  );

  const vpnDownloadLink = (
    <a href={`${auth.user.download}`} className='btn'>
      Download Lab OVPN
    </a>
  )

  const handleRequestVpnClick = (e) => {
    e.preventDefault();
    getRequestVPN()
  }

  const requestVPNLink = (
    <button onClick={handleRequestVpnClick} className='btn'>
      Request OVPN File
    </button>
  )

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
          <div>
            {auth.user.isStaff ? adminLink : null}
            <Link to='/logout' className='btn btn-light'>
              Logout
            </Link>
          </div>
        </div>
        <div className='bg-dark p-2'>
          <h1>Lab User</h1>
          <div>
            {auth.user.download ? vpnDownloadLink : requestVPNLink}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = state => ({
  auth: state.auth
});

const mapDispatchToProps = {
  getRequestVPN: requestVPN
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
