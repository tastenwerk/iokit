var konter = require('konter')
  , inter = require( __dirname + '/../../../index')
  , User = konter.models.User
  , moment = require('moment');

/**
 * get remote ip
 */
function remoteIp( req ){
  var ipAddress = null;
  if(req.headers['x-forwarded-for'])
    ipAddress = req.headers['x-forwarded-for'];
  else
    ipAddress = req.connection.remoteAddress;
  return ipAddress;
}

/**
 * try to login in the user
 * by looking up the database
 * for any matches with email and
 * hashed password
 */
function tryLoginUser( req, res, next ){
  User.findOne().or([ {email: req.body.email }, {'name.nick': req.body.email} ]).exec( function( err, user ){
    if( err ) req.flash('error', err);
    if( user && user.authenticate( req.body.password ) ){
      user.loginLog.push( {ip: remoteIp( req ) } );
      user.lastRequest = { createdAt: new Date(), ip: remoteIp( req ) };
      user.save( function( err ){
        if( err ) req.flash('error', err);
        if( user ){
          req.session.userId = user.id.toString();
          req.session.userIp = remoteIp( req );
          return res.redirect('/inter');
        } else
          next();
      })
    } else {
      console.log('auth error');
      req.flash('error', req.i18n.t('user.login_failed'));
      next();
    }
  });
}

module.exports = exports = {
  
  check: function( req, res, next ){
    console.log('session info', req.session);
    User.findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        if( user.lastRequest.createdAt.getTime() > moment().subtract('m', inter.config.session.timeout.mins ) ){
          user.lastRequest.createdAt = new Date();
          user.save( function( err ){
            if( err ) req.flash('error', err );
            res.locals.currentUser = user;
            next();
          })
        } else {
          req.session.userId = null;
          req.session.userIp = null;
          res.flash('error', req.i18n.t('user.session_timeout', {timeout: inter.config.session.timeout.mins}));
          res.redirect('/login');
        }
      } else {
        req.flash('error', req.i18n.t('user.login_required') );
        res.redirect('/login');
      }
    });
  },

  routes: function( app ){

    app.get('/login', function( req, res ){
      res.render( __dirname + '/views/login', { flash: { error: req.flash('error') } } );
    });

    app.post('/login', tryLoginUser, function( req, res ){
      res.render( __dirname + '/views/login', { flash: { error: req.flash('error') } } );
    });

  }

};