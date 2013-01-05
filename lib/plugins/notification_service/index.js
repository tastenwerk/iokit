var iomapper = require('iomapper');

// iokitnal modules
var Notification = require( __dirname + '/models/notification' )
  , User = iomapper.mongoose.models.User
  , auth = require( __dirname + '/../auth' );

var notificationServicePlugin = {

  routes: function(app){ 

    app.get('/notification_service.:format?', auth.check, function( req, res ){
      var keys = ['acl.'+res.locals.currentUser._id+'.privileges',
                  'acl.'+User.anybodyId+'.privileges',
                  'acl.'+User.everybodyId+'.privileges'];
      var acl = [];
      keys.forEach( function( key ){
        var aclEntry = {};
        aclEntry[key] = /r*/;
        acl.push( aclEntry );
      });

      Notification.find().or( acl ).populate('_creator').sort({ createdAt: -1 }).exec( function( err, notifications ){
        if( err ){
          req.flash('error', err);
          return res.json({ success: false, flash: req.flash() })
        }
        res.json( { success: true, data: notifications } );
      })
    });

  },

  socketware: function( io ){

    io
      .set('log level', 1)
      .of('/mainStream')
      .on('connection', function (socket) {
      socket.on( 'postMessage', function (data) {
        User.findById( iomapper.mongoose.Types.ObjectId( data.userId ), function( err, user ){
          if( err || !user ) return;
          var notification = new Notification( { message: data.message, _creator: user } );
          notification.save( function( err ){
            if( err )
              socket.emit( 'updateStream', { success: false, flash: {error: [ err ] } } );
            else{
              var safeNotification = {_id: notification._id, 
                                      message: notification.message, 
                                      _creator: user.toSafeObject(),
                                      createdAt: notification.createdAt };
              io.of('/mainStream').emit( 'updateStream', safeNotification );
            }
          });
        });
      });
    });

  }

}

module.exports = exports = notificationServicePlugin;