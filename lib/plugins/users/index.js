/**
 *
 * users (general CRUD operations)
 *
 */

var fs = require('fs')
  , path = require('path')

var konter = require('konter')
  , inter = require( __dirname + '/../../../index')
  , auth = require( __dirname + '/../auth' );

module.exports = exports = {
  
  routes: function( app ){

    app.get('/users/:id/pic', auth.check, getUser, function( req, res ){
      if( !req.user )
        return res.send( 'user not found' )
      if( fs.existsSync( path.join( inter.config.datastore.path, 'users', req.user._id ) ) )
        res.sendfile( path.join( inter.config.datastore.path, 'users', req.user._id ) );
      else
        res.sendfile( path.normalize(__dirname + '/../../../public/images/user.png') );
    });

  }

}

function getUser( req, res, next ){
  konter.mongoose.models.User.findById( req.params.id, function( err, user ){
    if( err ) return res.send( err );
    req.user = user;
    next();
  })
}