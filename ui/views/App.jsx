import $      from 'jquery';
import React  from 'react';
import Router from 'react-router';
import routes from './Routes.jsx';

$(function() {
  Router.run(routes, Router.HistoryLocation, function(Root) {
    React.render(<Root />, document.body);
  });
});
