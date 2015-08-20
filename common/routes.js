import config   from '../config/config.js';
import routster from 'routster';

var routes = {
  'socket.io' : '/socket.io',
  'filenames' : '/files/?',
  'ui_home'   : '/?',
  'ui_file'   : '/files/:filename/?'
};

export default {
  route   : routster.route(config.contextPath, routes, { relative : false }),
  reverse : routster.reverse(config.contextPath, routes, { relative : false }),
  asset   : routster.asset(config.contextPath, { relative : false })
};
