import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

const Navbar = ({ auth }) => {
  const staffLinks = (
    <ul>
      <li>
        <Link to='/dashboard'>Dashboard</Link>
        <Link to='/admin'>Admin Panel</Link>
      </li>
    </ul>
  );

  const authLinks = (
    <ul>
      <li>
        <Link to='/dashboard'>Dashboard</Link>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <Link to='/login'>Login</Link>
      </li>
    </ul>
  );

  return (
    <nav className='navbar bg-dark'>
      <h1>
        <Link to='/'>Tech Haven</Link>
        <a href='https://forums.thetechhaven.com' className='small'>
          Forums
        </a>
      </h1>
      {!auth.loading && (
        <Fragment>
          {auth.isAuthenticated
            ? auth.user.isStaff
              ? staffLinks
              : authLinks
            : guestLinks}
        </Fragment>
      )}
    </nav>
  );
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Navbar);
