import $               from 'jquery';
import React           from 'react';
import Router          from 'react-router';
import { Nav, Navbar } from 'react-bootstrap';
import { NavItemLink } from 'react-router-bootstrap';
import urlencode       from 'urlencode';

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
      return <NavItemLink key={f} to="ui_file" params={{filename : urlencode(f)}}>{f}</NavItemLink>
    });
    return (
      <div className="container">
        <div className="logserv-nav">
          <Navbar brand={<Router.Link to="ui_home">logserv</Router.Link>}>
            <Nav navbar>
              {files}
            </Nav>
          </Navbar>
        </div>
        <div className="logserv-content">
          <Router.RouteHandler />
        </div>
      </div>
    );
  }
});

export default Scaffold;
