import React    from 'react';
import Router   from 'react-router';
import routes   from '../../common/routes.js';
import Scaffold from './Scaffold.jsx';
import HomeView from './HomeView.jsx';

export default (
  <Router.Route handler={Scaffold}>
    <Router.Route name="ui_home" path={routes.route('ui_home')} handler={HomeView} />
  </Router.Route>
);
