import React, { Fragment, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Spinner from './Spinner';

import { loadUsersFromDb } from '../../actions/admin';

const useStyles = makeStyles({
  table: {
    minWidth: 650
  },
  tableHeader: {
    fontWeight: 'bold'
  }
});

const createData = (id, username) => {
  id += 1;
  return {
    id,
    username
  };
};

const Admin = ({ auth, admin, getUsersFromDb }) => {
  useEffect(() => {
    getUsersFromDb();
  }, [getUsersFromDb]);

  const classes = useStyles();

  if (auth.loading || admin.loading) {
    return <Spinner />;
  }
  if (!auth.isAuthenticated) {
    return <Redirect to='/login' />;
  }
  if (!auth.user.isStaff) {
    return <Redirect to='/dashboard' />;
  }

  let rows = admin.users.map(row => {
    return createData(row._id, row.username);
  });
  return (
    <Fragment>
      {
        <div className='profile-grid my-1'>
          <div className='profile-top bg-dark p-2'>
            <h1>Admin Panel</h1>
            <div className='bg-dark p-2'>
              <h3>Tech Haven Website Registrations</h3>
              <TableContainer component={Paper}>
                <Table className={classes.table} aria-label='simple table'>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader}>ID</TableCell>
                      <TableCell className={classes.tableHeader}>
                        Username
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell component='th' scope='row'>
                          {row.id}
                        </TableCell>
                        <TableCell>{row.username}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        </div>
      }
    </Fragment>
  );
};

const mapStateToProps = state => ({
  auth: state.auth,
  admin: state.admin
});

const mapDispatchToProps = {
  getUsersFromDb: loadUsersFromDb
};

export default connect(mapStateToProps, mapDispatchToProps)(Admin);
