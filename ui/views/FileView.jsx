import $         from 'jquery';
import React     from 'react';
import Router    from 'react-router';
import io        from 'socket.io-client';
import routes    from '../../common/ui_routes.js';
import urldecode from 'urldecode';

var socket;
var HomeView = React.createClass({
  refreshInterval : null,
  connect : function() {
    if (this.state.connectionState == 'connected' || this.state.connectionState == 'connecting') {
      return;
    }
    this.setState({ connectionState : 'connecting' });
    if (socket) {
      // connection had been established before, simply reconnect
      socket.connect();
    } else {
      socket = io.connect(window.location.origin, { path : routes.reverse('socket.io') });
    }
    socket
      .on('connect', () => {
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
    socket.emit('join', {filename:filename});
  },
  leave : function(filename) {
    if (this.state.connectionState != 'connected') {
      throw 'Trying to leave a room while disconnected';
    }
    socket.emit('leave', {filename:filename});
  },
  getInitialState : function() {
    return {
      lines : [],
      incoming : [],
      connectionState : 'disconnected',
      scrollToBottom : true,
      maxLines : localStorage.getItem('maxLines') || 50,
      maxLinesInput : localStorage.getItem('maxLines') || 50,
      maxLinesInputValid : true,
      maxLinesSaved : true
    };
  },
  componentDidUpdate : function() {
    if (this.state.scrollToBottom) {
      $('.logserv-log').scrollTop($('.logserv-log')[0].scrollHeight);
    }
  },
  componentWillReceiveProps : function(nextProps) {
    this.connect();
    if (socket && socket.connected) {
      this.leave(urldecode(this.props.params.filename));
      this.setState({lines:[]});
      this.join(urldecode(nextProps.params.filename));
    }
  },
  onRefreshTimeout : function() {

    if (this.state.incoming.length == 0) {
      return;
    }

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
    this.connect();
    $(window).resize(function() {
        $('.logserv-log').height($(window).height() - $('.logserv-nav').height() - $('.logserv-log').offset().top);
    });
    $(window).resize();
    this.refreshInterval = window.setInterval(this.onRefreshTimeout, 100);
  },
  componentWillUnmount : function() {
    this.disconnect();
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }
  },
  togglePause : function() {
    var newState = !this.state.scrollToBottom;
    console.log(newState, this.state.scrollToBottom);
    this.setState({ scrollToBottom : !this.state.scrollToBottom });
  },
  onKeyDownMaxLinesInput : function(evt) {
    if (evt.key === 'Enter') {
      this.onChangedMaxLines();
    }
  },
  onChangedMaxLinesInput : function(evt) {
    var valid = !isNaN(parseInt(evt.target.value));
    this.setState({ maxLinesInput : evt.target.value, maxLinesInputValid : valid, maxLinesSaved : false });
  },
  onChangedMaxLines : function() {
    if (!this.state.maxLinesInputValid) {
      return;
    }
    var maxLines = parseInt(this.state.maxLinesInput);
    while(this.state.lines.length > this.state.maxLines) {
      this.state.lines.shift();
    }
    localStorage.setItem('maxLines', maxLines);
    this.setState({ lines: this.state.lines, maxLines : maxLines, maxLinesSaved : true });
  },
  render : function() {
    var lines = this.state.lines == null ? 'Loading...' : this.state.lines.map((l) =>{
      return l + '\n';
    });
    return (
      <div>
        <div className="row">
          <div className="col-md-6 form-group">
            <div className={this.state.maxLinesSaved ? 'form-group' : this.state.maxLinesInputValid ? 'form-group has-success' : 'form-group has-error'}>
                <label className="control-label" htmlFor="maxLinesInput">Display&nbsp;</label>
                <input type="text"
                  id="maxLinesInput"
                  classNames="form-control"
                  value={this.state.maxLinesInput}
                  onChange={this.onChangedMaxLinesInput}
                  onKeyDown={this.onKeyDownMaxLinesInput}></input>
                <label className="control-label" htmlFor="maxLinesInput">&nbsp;lines&nbsp;</label>
                <input type="submit" onClick={this.onChangedMaxLines}/>
            </div>
          </div>
          <div className="col-md-6 form-group">
            <button type="button"
              id="buttonScrollToBottom"
              className={this.state.scrollToBottom ? "btn btn-default pull-right" : "active btn btn-default pull-right"}
              aria-label="Left Align">
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
