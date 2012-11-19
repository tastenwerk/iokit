/**
 *
 * users (general CRUD operations)
 *
 */

var fs = require('fs')
  , path = require('path')
  , im = require('imagemagick');

var konter = require('konter')
  , inter = require( __dirname + '/../../../index')
  , auth = require( __dirname + '/../auth' )
  , streambuffer = require( __dirname + '/../../../lib/streambuffer');

var User = konter.mongoose.models.User;

module.exports = exports = {
  
  routes: function( app ){

    /**
     * SHOW the user
     */
    app.get('/users/:id', auth.check, getUser, function( req, res ){
      if( !req.user )
        return res.send( 'alert("user not found");' );
      res.render( __dirname+'/views/users/show.ejs', {user: req.user, partialPath: __dirname + '/views/users/show.jade'} );
    });

    /**
     * show the UPLOAD form for a new user picture
     */
    app.get('/users/:id/change_pic_modal', auth.check, getUser, function( req, res ){
      if( !req.user )
        return res.send(' user not found ');
      res.render( __dirname + '/views/users/change_pic_modal.jade', {user: req.user} );
    });

    /**
     * Perform the actual upload for the user picture
     */
    app.post('/users/:id/change_pic_modal', streambuffer, auth.check, getUser, function( req, res ){

      var PAUSE_TIME = 5000
        , bytesUploaded = 0;
    
      console.log(req.headers);
      console.log(req.body);
      console.log(req.files);

      if(req.xhr) {
        console.log('Uploading...');
        var fileName = req.header('x-file-name');
        var fileSize = req.header('content-length');
        var fileType = req.header('x-mime-type');

        var userDirPath = path.join( inter.config.datastore.absolutePath, 'users', req.user._id );
        if( !fs.existsSync( path.join( inter.config.datastore.absolutePath ) ) )
          fs.mkdirSync( inter.config.datastore.absolutePath );
        if( !fs.existsSync( path.join( inter.config.datastore.absolutePath, 'users' ) ) )
          fs.mkdirSync( path.join( inter.config.datastore.absolutePath, 'users' ) );
        if( !fs.existsSync( userDirPath ) )
          fs.mkdirSync( userDirPath );
        var origName = path.join( userDirPath, 'profile_orig'+path.extname(fileName) );

        var fileStream = fs.createWriteStream( origName );
        /*
        var file = fs.createWriteStream(filePath, {
        flags: 'w',
        encoding: 'binary',
        mode: 0644
        });*/


        req.streambuffer.ondata( function( chunk ) {
          console.log('getting data');
            if( bytesUploaded+chunk.length > (inter.config.max_upload_size_mb || 5)*1024*1024 ) {
              fileStream.end();
              res.send(JSON.stringify({error: "Too big."}));
            }
            fileStream.write(chunk);
            bytesUploaded += chunk.length;
            req.pause();
            setTimeout(function() { req.resume(); }, PAUSE_TIME);
        });

        req.streambuffer.onend( function() {
          fileStream.end();
          im.readMetadata( origName, function(err, metadata){
            var x = parseInt(metadata.exif.pixelXDimension);
            var y = parseInt(metadata.exif.pixelYDimension);
            var resizeOpts = { srcPath: origName, dstPath: path.join( userDirPath, 'profile.jpg' ) };
            if( x > y )
              resizeOpts['height'] = 150
            else
              resizeOpts['width'] = 150
            im.resize( resizeOpts, function( err, stdout, stderr ){
              console.log('stdout', stdout);
              console.log('stderr', stderr);
              req.flash('notice', req.i18n.t('user.picture.upload.ok'));
              res.json({ success: true, flash: req.flash() });
            });
          });
        });

      } // if xhr

    });

    app.get('/users/:id/pic', auth.check, getUser, function( req, res ){
      if( !req.user )
        return res.send( 'user not found' )
      if( fs.existsSync( path.join( inter.config.datastore.path, 'users', req.user._id ) ) )
        res.sendfile( path.join( inter.config.datastore.path, 'users', req.user._id ) );
      else
        res.sendfile( path.normalize(__dirname + '/../../../public/images/user.png') );
    });

    app.get('/users/docklets/messages', auth.check, function( req, res ){
      res.render( __dirname + '/views/users/docklets/messages' );
    });

    app.post('/users/docklets', auth.check, function( req, res ){
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

    app.get('/users.json', auth.check, function( req, res ){
      var q = {};
      User.find(q, function( err, users ){
        if( err )
          res.json( { error: err } );
        else
          res.json( users );
      });
    });

    app.put('/users/:id', auth.check, getUser, function( req, res ){
      if( req.user ){
        console.log('got user')
        if( res.locals.currentUser.roles.indexOf('manager') || req.user._id === res.locals.currentUser._id ){
          for( var i in req.body.user )
            req.user[i] = req.body.user[i];
          req.user.save( function( err ){
            console.log('updatd');
            if( err )
              req.flash('error', err);
            else
              req.flash('notice', req.i18n.t('user.docklets_settings_saved') );
            res.render( __dirname + '/views/users/update.ejs', {flash: req.flash()} );
          });
        } else {
          req.flash('error', req.i18n.t('not_found') );
          res.render( __dirname + '/views/users/update.ejs', {flash: req.flash()} );
        }
      }
      else{
        req.flash('error', req.i18n.t('not_found') );
        res.render( __dirname + '/views/users/update.ejs', {flash: req.flash()} );
      }
    })

  },

  docklets: [ 'messages' ]

}

function getUser( req, res, next ){
  User.findById( req.params.id, function( err, user ){
    if( err ) return res.send( err );
    req.user = user;
    next();
  })
}