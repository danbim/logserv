import routster from 'routster';

var routes = {
  'socket.io' : '/socket.io',
  'filenames' : '/files/?',
  'ui_home'   : '/?',
  'ui_file'   : '/files/:filename/?'
};

export default {
  route   : routster.route(window.logserv_contextPath, routes, { relative : false }),
  reverse : routster.reverse(window.logserv_contextPath, routes, { relative : false }),
  asset   : routster.asset(window.logserv_contextPath, { relative : false })
};
