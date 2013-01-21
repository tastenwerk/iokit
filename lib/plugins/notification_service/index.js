// iokitnal modules
var auth = require( __dirname + '/../auth' )
  , iomapper = require('iomapper')
  , User = iomapper.mongoose.models.User
  , iokit = require( __dirname + '/../../../index');

//iokit.view.paths = [ __dirname + '/views' ].concat( iokit.view.paths );

var notificationServicePlugin = {

  routes: function(app){ 

    app.get('/notification_service.:format?', auth.check, function( req, res ){
      var keys = [res.locals.currentUser._id.toString(),
                  User.anybodyId.toString(),
                  User.everybodyId.toString()];

      iomapper.mongoose.models.Notification.find().in( 'read', keys ).populate('_creator').populate('_affectedUser').sort({ createdAt: -1 }).exec( function( err, notifications ){
        if( err ){
          console.log('err:', err);
          req.flash('error', err);
          return res.json({ success: false, flash: req.flash() })
        }
        res.json( { success: true, data: notifications } );
      })
    });

    /**
     * the messages docklet
     * as a dashboard plugin
     */
    app.get('/notification_service/docklets/stream', auth.check, function( req, res ){
      res.render( __dirname + '/views/notification_services/docklets/stream' );
    });

    /**
     * posting a message to the
     * messages docklet
     */
    app.post('/notification_service/docklets/messages', auth.check, function( req, res ){
      var currentUser = res.locals.currentUser;
      if( currentUser.preferences.docklets && currentUser.preferences.docklets instanceof Array )
        if( currentUser.preferences.docklets.indexOf( req.body.docklets ) < 0 )
          currentUser.preferences.docklets.push( req.body.docklets );
      else
        currentUser.preferences.docklets = (req.body.docklets instanceof Array ? req.body.docklets : [ req.body.docklets ]);
      currentUser.markModified('preferences');
      currentUser.save( function( err ){
        console.log('inside', err);
        if( err )
          req.flash('error', err);
        else
          req.flash('notice', req.i18n.t('user.docklets_settings_saved') );
        res.render( __dirname + '/views/users/update.ejs', {flash: req.flash()} );
      })
    });

  },

  docklets: [ 'stream' ],

  socketware: function( io ){

    io
      .set('log level', 1)
      .of('/mainStream')
      .on('connection', function (socket) {
      socket.on( 'postMessage', function (data) {
        User.findById( iomapper.mongoose.Types.ObjectId( data.userId ), function( err, user ){
          if( err || !user ) return;
          var notification = new iomapper.mongoose.models.Notification( { message: data.message, _creator: user, type: 'Message' } );
          notification.read.push( iomapper.mongoose.models.User.anybodyId );
          notification.save( function( err ){
            if( err )
              socket.emit( 'updateStream', { success: false, flash: {error: [ err ] } } );
            else{
              var safeNot = notification.toObject();
              safeNot._creator = user.toObject();
              io.of('/mainStream').emit( 'updateStream', safeNot );
            }
          });
        });
      });
    });

    // extend Notification model
    iomapper.mongoose.models.Notification.schema.post( 'save', function(notification){
      if( notification.type !== 'Message' )
        io.of('/mainStream').emit( 'updateStream', notification );
    });

  }

}

module.exports = exports = notificationServicePlugin;