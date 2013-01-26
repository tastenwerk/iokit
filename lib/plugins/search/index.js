// iokitnal modules
var auth = require( __dirname + '/../auth' )
  , iomapper = require('iomapper')
  , moment = require('moment')
  , iokit = require( __dirname + '/../../../index');


var notificationServicePlugin = {

  routes: function( app ){

    app.get('/search', auth.check, function(req, res ){
      res.render( __dirname+'/views/index.jade' );
    });

    app.post('/search.:format', auth.check, function( req, res ){
      var query = new RegExp(req.body.query,'i');
      iomapper.findAnyWithUser( res.locals.currentUser, {name: query}, function( err, results ){
        if( err ){
          console.log(err);
          req.flash('error', err)
        }
        res.json({ flash: req.flash(), success: (err===null), data: results }); 
      })
    });

  },

  sidebarBottomWidget: true,

}

module.exports = exports = notificationServicePlugin;