import $      from 'jquery';
import React  from 'react';
import Router from 'react-router';
import routes from '../../common/routes.js';

var HomeView = React.createClass({
  render : function() {
    return (
      <div className="row">
        <div className="col-md-12">
          <h1>Logserv <small>tail -f log files to your Browser</small></h1>
        </div>
      </div>
    );
  }
});

export default HomeView;
