var konter = require('konter')
  , inter = require( __dirname + '/../../../index')
  , User = konter.models.User
  , moment = require('moment');

// append view path so they can be overridden
inter.view.paths.push( __dirname + '/views' );

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
      if(user.loginLog.length > 30)
        user.loginLog = user.loginLog.slice(0,30);
      console.log('sliced login log to', user.loginLog.length);
      user.loginLog.push( {ip: remoteIp( req ) } );
      user.lastRequest = { createdAt: new Date(), ip: remoteIp( req ) };
      user.save( function( err ){
        if( err ) req.flash('error', err);
        if( user ){
          req.session.userId = user.id.toString();
          req.session.userIp = remoteIp( req );
          res.locals.currentUser = user;
        }
        next();
      })
    } else {
      req.flash('error', req.i18n.t('user.login_failed'));
      next();
    }
  });
}

function redirectLogin( req, res ){

  if( req.redirectLogin )
    if( typeof(req.redirectLogin) === 'function' )
      req.redirectLogin( req, res );
    else
      res.redirect( req.redirectLogin );
  else
    res.redirect('/login');
}

module.exports = exports = {

  tryLoginUser: tryLoginUser,
  
  check: function( req, res, next ){
    User.findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        req.user = user;
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
          req.flash('error', req.i18n.t('user.session_timeout', {timeout: inter.config.session.timeout.mins}));
          redirectLogin( req, res );
        }
      } else {
        req.flash('error', req.i18n.t('user.login_required') );
        redirectLogin( req, res );
      }
    });
  },

  checkWithoutRedirect: function( req, res, next ){
    User.findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        req.user = user;
        if( user.lastRequest.createdAt.getTime() > moment().subtract('m', inter.config.session.timeout.mins ) ){
          user.lastRequest.createdAt = new Date();
          user.save( function( err ){
            if( err ) req.flash('error', err );
            res.locals.currentUser = user;
            next();
          })
        } else
        next();
      } else
        next();
    });
  },

  routes: function( app ){

    app.get('/login', function( req, res ){
      res.render( inter.view.lookup( 'auth/login.jade' ), { flash: req.flash(), title: inter.config.site.title+'|tas10box' } );
    });

    app.get('/logout', function( req, res ){
      req.session.userId = null;
      req.session.userIp = null;
      res.render( inter.view.lookup( 'auth/login.jade' ), { flash: { notice: [ req.i18n.t('user.logged_off') ] } } );
    });

    app.post('/login', tryLoginUser, function( req, res ){
      if( res.locals.currentUser )
        res.render( __dirname + '/../../../app/views/index', {title: inter.config.site.title+'|tas10box'} );
      else
        res.render( inter.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
    });

  }

};