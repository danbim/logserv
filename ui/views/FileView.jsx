import $         from 'jquery';
import React     from 'react';
import Router    from 'react-router';
import io        from 'socket.io-client';
import routes    from '../../common/routes.js';
import urldecode from 'urldecode';

var socket;
var HomeView = React.createClass({
  connect : function() {
    console.log('connect', this.state);
    if (this.state.connectionState == 'connected' || this.state.connectionState == 'connecting') {
      return;
    }
    this.setState({ connectionState : 'connecting' });
    if (socket) {
      // connection had been established before, simply reconnect
      console.log('reconnecting closed socket');
      socket.connect();
    } else {
      socket = io.connect(window.location.origin, { path : routes.reverse('socket.io') });
    }
    socket
      .on('connect', () => {
        console.log('connected');
        if (this.isMounted()) {
          this.setState({ lines:[], connectionState : 'connected' });
        }
        this.join(urldecode(this.props.params.filename));
      })
      .on('connect_error', console.log)
      .on('connect_timeout', console.log)
      .on('reconnect', console.log)
      .on('reconnect_attempt', console.log)
      .on('reconnecting', console.log)
      .on('reconnect_error', console.log)
      .on('reconnect_failed', console.log)
      .on('log', (data) => {
        if (this.isMounted()) {
          if (data.filename == urldecode(this.props.params.filename)) {
            var lines = this.state.lines || [];
            lines.push(data.line);
            this.setState({lines : lines});
          } else {
            console.log('received data for filename not subscribed to: "%s"', data.filename);
          }
        }
      })
      .on('disconnect', () => {
        console.log('disconnected');
        this.setState({ lines : null, connectionState : 'disconnected' });
      });
  },
  disconnect : function() {
    if (socket && this.state.connectionState == 'connected') {
      socket.disconnect();
    }
  },
  join : function(filename) {
    if (this.state.connectionState != 'connected') {
      throw 'Trying to join a room while disconnected';
    }
    console.log('joining', filename);
    socket.emit('join', {filename:filename});
  },
  leave : function(filename) {
    if (this.state.connectionState != 'connected') {
      throw 'Trying to leave a room while disconnected';
    }
    console.log('leaving', filename);
    socket.emit('leave', {filename:filename});
  },
  connectionState : function() {

  },
  getDefaultProps : function() {
    console.log('getDefaultProps', this.props, this.state);
  },
  getInitialState : function() {
    console.log('getInitialState', this.props, this.state);
    return { lines : null, connectionState : 'disconnected' };
  },
  componentWillMount : function() {
    console.log('componentWillMount', this.props, this.state);
  },
  componentDidMount : function() {
    console.log('componentDidMount', this.props, this.state);
    this.connect();
  },
  componentWillReceiveProps : function(nextProps) {
    console.log('componentWillReceiveProps');
    this.connect();
    if (socket && socket.connected) {
      this.leave(urldecode(this.props.params.filename));
      this.setState({lines:[]});
      this.join(urldecode(nextProps.params.filename));
    }
  },
  shouldComponentUpdate : function() {
    console.log('shouldComponentUpdate', this.props, this.state);
    return true;
  },
  componentWillUnmount : function() {
    console.log('componentWillUnmount');
    this.disconnect();
  },
  render : function() {
    console.log('render', this.props, this.state);
    var lines = this.state.lines == null ? 'Loading...' : this.state.lines.map((l) =>{
      return l + '\n';
    });
    return (
      <div className="row">
        <div className="col-md-12">
          <pre>{lines}</pre>
        </div>
      </div>
    );
  }
});

export default HomeView;
