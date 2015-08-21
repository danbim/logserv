import $         from 'jquery';
import React     from 'react';
import Router    from 'react-router';
import io        from 'socket.io-client';
import routes    from '../../common/routes.js';
import urldecode from 'urldecode';

var socket;
var HomeView = React.createClass({
  lastRender : -1,
  connect : function() {
    //console.log('connect', this.state);
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
            var incoming = this.state.incoming || [];
            incoming.push(data.line);
            this.setState({ incoming : incoming });
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
    //console.log('joining', filename);
    socket.emit('join', {filename:filename});
  },
  leave : function(filename) {
    if (this.state.connectionState != 'connected') {
      throw 'Trying to leave a room while disconnected';
    }
    //console.log('leaving', filename);
    socket.emit('leave', {filename:filename});
  },
  getDefaultProps : function() {
    //console.log('getDefaultProps', this.props, this.state);
  },
  getInitialState : function() {
    //console.log('getInitialState', this.props, this.state);
    return {
      lines : [],
      incoming : [],
      connectionState : 'disconnected',
      scrollToBottom : true,
      maxLines : 50,
      maxLinesInput : 50
    };
  },
  componentWillMount : function() {
    //console.log('componentWillMount', this.props, this.state);
  },
  componentDidUpdate : function() {
    if (this.state.scrollToBottom) {
      $('.logserv-log').scrollTop($('.logserv-log')[0].scrollHeight);
    }
  },
  componentWillReceiveProps : function(nextProps) {
    //console.log('componentWillReceiveProps');
    this.connect();
    if (socket && socket.connected) {
      this.leave(urldecode(this.props.params.filename));
      this.setState({lines:[]});
      this.join(urldecode(nextProps.params.filename));
    }
  },
  refreshInterval : null,
  onRefreshTimeout : function() {

    if (this.state.incoming.length == 0) {
      return;
    }

    console.log('onRefreshTimeout');

    var lines    = this.state.lines;
    var maxLines = this.state.maxLines;
    var incoming = this.state.incoming;

    if (incoming.length > maxLines) {
      lines = incoming;
    } else {
      lines = lines.concat(incoming);
    }
    while (incoming.length > maxLines) {
      incoming.shift();
    }
    this.setState({lines : lines, incoming : []});
  },
  componentDidMount : function() {
    //console.log('componentDidMount', this.props, this.state);
    this.connect();
    $(window).resize(function() {
        $('.logserv-log').height($(window).height() - $('.logserv-nav').height() - $('.logserv-log').offset().top);
    });
    $(window).resize();
    this.refreshInterval = window.setInterval(this.onRefreshTimeout, 100);
  },
  componentWillUnmount : function() {
    //console.log('componentWillUnmount');
    this.disconnect();
    if (this.refreshInterval) {
      window.clearInterval(refreshInterval);
    }
  },
  togglePause : function() {
    //console.log('togglePause', this.state.scrollToBottom);
    this.setState({ scrollToBottom : !this.state.scrollToBottom });
  },
  onChangedMaxLinesInput : function(evt) {
    this.setState({ maxLinesInput : evt.target.value });
  },
  onChangedMaxLines : function(evt) {
    var maxLines = parseInt(this.state.maxLinesInput);
    if (maxLines != 'NaN') {
      while(this.state.lines.length > maxLines) {
        this.state.lines.shift();
      }
      this.setState({ lines: this.state.lines, maxLines : maxLines });
    }
  },
  render : function() {
    this.lastRender = new Date().getTime();
    //console.log('render', this.props, this.state);
    var lines = this.state.lines == null ? 'Loading...' : this.state.lines.map((l) =>{
      return l + '\n';
    });
    return (
      <div>
        <div className="row">
          <div className="col-md-12 pull-right">
            <input type="text" value={this.state.maxLinesInput} onChange={this.onChangedMaxLinesInput}></input>
            <button type="button" onClick={this.onChangedMaxLines}>Update</button>
            <button type="button" className={this.state.scrollToBottom ? "btn btn-default" : "active btn btn-default"} aria-label="Left Align">
              <span className="glyphicon glyphicon-pause" aria-hidden="true" onClick={this.togglePause}></span>
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <pre className="logserv-log">{lines}</pre>
          </div>
        </div>
      </div>
    );
  }
});

export default HomeView;
