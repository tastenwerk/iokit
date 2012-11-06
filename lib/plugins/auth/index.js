var konter = require('konter')
  , User = konter.models.User;

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
  console.log('looking up konter');
  User.find().or([ {email: req.body.email }, {'name.nick': req.body.email} ]).exec( function( err, user ){
    if( err ) req.flash('error', err);
    if( user && user.authenticate( req.body.password ) ){
      user.loginLog.push( {ip: remoteIp( req ) } );
      user.lastRequest = { createdAt: Date.now, ip: remoteIp( req ) };
      user.save( function( err ){
        if( err ) req.flash('error', err);
        if( user ){
          req.session.userId = user.id;
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
    User.findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user && user.lastRequest.createdAt.getTime() > moment().subtract('m', req.locals.inter.config.session.timeout.mins ) ){
        user.lastRequest.createdAt = Date.now;
        user.save( function( err ){
          if( err ) req.flash('error', err );
          next();
        })
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