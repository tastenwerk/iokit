var iomapper = require('iomapper')
  , iokit = require( __dirname + '/../../../index')
  , User = iomapper.models.User
  , moment = require('moment');

// append view path so they can be overridden
iokit.view.paths.push( __dirname + '/views' );

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

  remoteIp: remoteIp,
  
  tryLoginUser: tryLoginUser,
  
  check: function( req, res, next ){
    User.findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        req.user = user;
        if( user.lastRequest.createdAt.getTime() > moment().subtract('m', iokit.config.session.timeout.mins ) ){
          user.lastRequest.createdAt = new Date();
          user.save( function( err ){
            if( err ) req.flash('error', err );
            res.locals.currentUser = user;
            next();
          })
        } else {
          req.session.userId = null;
          req.session.userIp = null;
          req.flash('error', req.i18n.t('user.session_timeout', {timeout: iokit.config.session.timeout.mins}));
          redirectLogin( req, res );
        }
      } else {
        req.flash('error', req.i18n.t('user.login_required') );
        redirectLogin( req, res );
      }
    });
  },

  admin: function( req, res, next ){
    if( res.locals.currentUser && res.locals.currentUser.roles.indexOf('manager') >= 0 )
      return next();
    res.send(403);
  },

  checkWithoutRedirect: function( req, res, next ){
    User.findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        req.user = user;
        if( user.lastRequest.createdAt.getTime() > moment().subtract('m', iokit.config.session.timeout.mins ) ){
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

    app.get('/login', this.checkWithoutRedirect, function( req, res ){
      if( res.locals.currentUser )
        return res.redirect('/admin');
      res.render( iokit.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
    });

    app.get('/logout', function( req, res ){
      req.session.userId = null;
      req.session.userIp = null;
      res.render( iokit.view.lookup( 'auth/login.jade' ), { flash: { notice: [ req.i18n.t('user.logged_off') ] } } );
    });

    app.get('/forgot_password', function( req, res ){
      res.render( iokit.view.lookup( 'auth/forgot_password.jade' ), { flash: {} } );
    });

    app.post('/reset_password', function( req, res ){
      var crypto = require('crypto');
      var confirmationKey = crypto.createHash('sha1').update((new Date()).toString(32)).digest('hex');
      User.findOne( {email: req.body.email}, function( err, user ){
        if( user ){
          user.update({ confirmation: { key: confirmationKey,
                                        expires: moment().add('d',1).toDate(),
                                        tries: 3 } }, function( err ){
            if( err ){
              req.flash('error', err);
              console.log(err);
              res.render( iokit.view.lookup( 'auth/forgot_password.jade' ), { flash: req.flash() } );
            } else {
              iokit.sendMail.deliver({ 
                to: req.body.email,
                subject: '['+iokit.config.site.title+'] '+req.i18n.t('forgot_password.reset_request'),
                text: req.i18n.t('forgot_password.reset_request_text') +
                      "  " + iokit.config.hostname + "/users/"+ user._id + "/reset_password?key=" + confirmationKey +
                      req.i18n.t('bye', {site: iokit.config.site.title})
                }, 
                function( err, response ){
                  if( err ){
                    console.log( err );
                    req.flash('error', err);
                  } else
                    req.flash('notice', req.i18n.t('forgot_password.reset_send'));
                  res.render( iokit.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
              });
            }

          });
        } else {
          req.flash('error', req.i18n.t('forgot_password.email_not_found') );
          res.render( iokit.view.lookup( 'auth/forgot_password.jade' ), { flash: req.flash() } );
        }
      });
    });

    function setPasswordRoute( req, res ){
      User.findOne( {_id: iomapper.mongoose.Types.ObjectId(req.params.id),
                     'confirmation.key': req.query.key}, function( err, user ){
        if( err ){
          console.log(err);
          req.flash('error', err);
        }
        if( user )
          res.render( iokit.view.lookup( 'auth/set_password.jade' ), { flash: {}, user: user } )
        else{
          req.flash('error', req.i18n.t('forgot_password.key_not_found') );
          res.render( iokit.view.lookup( '/auth/login.jade' ), { flash: req.flash() } )
        }
      });
    }

    app.get('/users/:id/reset_password', setPasswordRoute);
    app.get('/users/:id/confirm', setPasswordRoute);

    app.post('/users/:id/set_password', function( req, res ){
      User.findById( req.params.id, function(err, user){
        if( err ){
          console.log(err);
          req.flash('error', err);
        }
        if( user ){
          if( user.confirmation.key === req.body.key ){
            if( req.body.password && req.body.password_confirm && req.body.password == req.body.password_confirm ){
              user.password = req.body.password;
              user.confirmation.key = null;
              user.save( function( err ){
                if( err ){
                  console.log( err );
                  req.flash( 'error', err )
                } else
                  req.flash('notice', req.i18n.t('forgot_password.reset_finished'))
                return res.render( iokit.view.lookup('/auth/login.jade'), { flash: req.flash() });
              })
            } else {
              req.flash( 'error', req.i18n.t('user.new_passwords_missmatch') )
              return res.rener( iokit.view.lookup('/auth/set_password'), { flash: req.flash(), user: user } )
            }
          } else{
            req.flash('error', 'confirmation key missmatch');
            return res.render( iokit.view.lookup( '/auth/login.jade' ), { flash: {} } )
          }
        } else
          res.render( iokit.view.lookup( '/login' ), { flash: req.flash() } )

      });
    });

    app.post('/login', tryLoginUser, function( req, res ){
      if( res.locals.currentUser )
        //res.render( __dirname + '/../../../app/views/index', {title: iokit.config.site.title+'|tas10box'} );
        res.redirect( '/admin' );
      else
        res.render( iokit.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
    });

  }

};