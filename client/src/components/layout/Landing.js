import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

const Landing = ({ auth: { isAuthenticated, loading } }) => {
  const authLink = (
    <Link to='/dashboard' className='btn btn-light'>
      Go to Dashboard
    </Link>
  );
  const guestLink = (
    <Link to='/login' className='btn btn-light'>
      Login with Discord
    </Link>
  );
  return (
    <section className='landing'>
      <div className='dark-overlay'>
        <div className='landing-inner'>
          <h1 className='x-large logo'>Tech Haven</h1>
          <p className='lead'>A safe space for nerds to learn about IT.</p>
          <div className='buttons'>
            <a href='https://discord.gg/7Duvh66' className='btn btn-primary'>
              Join us on Discord
            </a>
            {!loading && (
              <Fragment>{isAuthenticated ? authLink : guestLink}</Fragment>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Landing);
