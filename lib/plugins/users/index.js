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
    app.post('/users/:id/change_pic_modal', auth.check, getUser, function( req, res ){

      console.log(req.picture );
      return res.render({});
      fs.readFile(req.picture.path, function (err, data) {
        var userDirPath = path.join( inter.config.datastore.absolutePath, 'users', req.user._id );
        if( fs.existsSync( path.join( inter.config.datastore.path ) ) )
          fs.mkdirSync( inter.config.datastore.absolutePath );
        if( fs.existsSync( path.join( inter.config.datastore.path, 'users' ) ) )
          fs.mkdirSync( path.join( inter.config.datastore.absolutePath, 'users' ) );
        if( fs.existsSync( userDirPath ) )
          fs.mkdirSync( userDirPath );
        console.log('relpath', userDirPath);
        if( !fs.existsSync( path.join(inter.config.datastore.absolutePath, relPath ) ) )
          fs.mkdirSync( path.join(inter.config.datastore.absolutePath, relPath) );
        for( var i=0; i < ancestors.length; i++ ){
          for( var j=0; j <= i; j++)
            relPath = path.join(relPath, ancestors[j].name);
          console.log('relPath', relPath);
          if( !fs.existsSync( path.join( inter.config.datastore.absolutePath, relPath ) ) )
            fs.mkdirSync(path.join( inter.config.datastore.absolutePath, relPath ) );
        }
        relPath = path.join(relPath, f);
        fs.writeFile( path.join( inter.config.datastore.absolutePath, relPath ), data, function (err) {
          file.relativePath = relPath;
          file.save( function( err ){
            console.log('done uploading')
            if( err )
              req.flash('error', req.i18n.t('files.failed_to_save_rel_path', {name: file.name}));
            else
              req.flash('notice', req.i18n.t('files.success', {name: file.name}));
            console.log('done uploading', err)
            res.json({ flash: req.flash() });
          });
        });
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