import React, { Fragment } from 'react';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import { downloadVpn } from '../../actions/auth';

const Dashboard = ({ auth, downloadVpn }) => {
  if (auth.loading) {
    return <Spinner />;
  }
  if (!auth.isAuthenticated) {
    return <Redirect to='/login' />;
  }

  const onClick = () => {
    downloadVpn(auth.user.xAuthToken);
  };

  const adminLink = (
    <Link to='/admin' className='btn'>
      Admin Panel
    </Link>
  );

  const vpnDownloadButton = (
    <div onClick={onClick} className='btn btn-light'>
      Download Lab VPN
    </div>
  );

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
      </div>
      <div className='profile-grid my-1'>
        <div className='profile-top bg-dark p-2'>
          <h1>Lab</h1>
          <div>{auth.user.xAuthToken ? vpnDownloadButton : null}</div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps, { downloadVpn })(Dashboard);
