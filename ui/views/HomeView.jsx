import $      from 'jquery';
import React  from 'react';
import Router from 'react-router';
import io     from 'socket.io-client';
import routes from '../../common/ui_routes.js';

var eventSource;
var HomeView = React.createClass({
  render : function() {
    return (
      <div className="row">
        <div className="col-md-12">
          <h1>logserv <small>tail -f log files to your Browser</small></h1>
          <p>Select one of the logfiles from the navigation on top!</p>
        </div>
      </div>
    );
  }
});

export default HomeView;
