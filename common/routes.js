import config   from 'config';
import routster from 'routster';

var routes = {
  'socket.io' : '/socket.io',
  'filenames' : '/files/?',
  'ui_home'   : '/?',
  'ui_file'   : '/files/:filename/?'
};

export default {
  route   : routster.route(config.get('contextPath'), routes, { relative : false }),
  reverse : routster.reverse(config.get('contextPath'), routes, { relative : false }),
  asset   : routster.asset(config.get('contextPath'), { relative : false })
};
