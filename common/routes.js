import config   from '../config/config.js';
import routster from 'routster';

var routes = {
  'ui_home' : '/?'
};

export default {
  route   : routster.route(config.contextPath, routes, { relative : false }),
  reverse : routster.reverse(config.contextPath, routes, { relative : false }),
  asset   : routster.asset(config.contextPath, { relative : false })
};
