import $               from 'jquery';
import React           from 'react';
import Router          from 'react-router';
import { Nav, Navbar } from 'react-bootstrap';
import { NavItemLink } from 'react-router-bootstrap';

var Scaffold = React.createClass({
  render : function() {
    return (
      <div className="container">
        <Navbar brand="logserv">
          <Nav navbar>
            <NavItemLink to="ui_home">Home</NavItemLink>
          </Nav>
        </Navbar>
        <Router.RouteHandler />
      </div>
    );
  }
});

export default Scaffold;
