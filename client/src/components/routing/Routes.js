import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Dashboard from '../layout/Dashboard';
import Login from '../auth/Login';
import Logout from '../auth/Logout';

const Routes = () => {
  return (
    <section className='container'>
      <Switch>
        <Route exact path='/dashboard' component={Dashboard} />
        <Route exact path='/login' component={Login} />
        <Route exact path='/logout' component={Logout} />
      </Switch>
    </section>
  );
};

export default Routes;
