import $               from 'jquery';
import React           from 'react';
import Router          from 'react-router';
import { Nav, Navbar } from 'react-bootstrap';
import { NavItemLink } from 'react-router-bootstrap';

import routes          from '../../common/routes.js';

var Scaffold = React.createClass({
  getInitialState : function() {
    return {
      filenames : []
    };
  },
  componentDidMount : function() {
    $.getJSON(routes.reverse('filenames'), (filenames) => {
      this.setState({filenames : filenames});
    });
  },
  render : function() {
    var files = this.state.filenames.map((f) => {
      return <NavItemLink key={f} to="ui_file" params={{filename : f}}>{f}</NavItemLink>
    });
    return (
      <div className="container">
        <Navbar brand={<Router.Link to="ui_home">logserv</Router.Link>}>
          <Nav navbar>
            {files}
          </Nav>
        </Navbar>
        <Router.RouteHandler />
      </div>
    );
  }
});

export default Scaffold;
