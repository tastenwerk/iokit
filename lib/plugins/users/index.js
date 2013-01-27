/**
 *
 * users (general CRUD operations)
 *
 */

var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , easyimg = require('easyimage')
  , moment = require('moment')
  , exec = require('child_process').exec;

var iomapper = require('iomapper')
  , iokit = require( __dirname + '/../../../index')
  , auth = require( __dirname + '/../auth' )
  , streambuffer = require( __dirname + '/../../../lib/streambuffer');

var User = iomapper.mongoose.models.User;

iokit.view.paths = [ __dirname + '/views' ].concat( iokit.view.paths );

module.exports = exports = {
  
  routes: function( app ){

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

      if(req.xhr) {
        var fileName = req.header('x-file-name');
        var fileSize = req.header('content-length');
        var fileType = req.header('x-mime-type');

        var userDirPath = path.join( iokit.config.datastore.absolutePath, 'users', req.user._id.toString() );
        if( !fs.existsSync( path.join( iokit.config.datastore.absolutePath ) ) )
          fs.mkdirSync( iokit.config.datastore.absolutePath );
        if( !fs.existsSync( path.join( iokit.config.datastore.absolutePath, 'users' ) ) )
          fs.mkdirSync( path.join( iokit.config.datastore.absolutePath, 'users' ) );
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
            if( bytesUploaded+chunk.length > (iokit.config.max_upload_size_mb || 5)*1024*1024 ) {
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
          resizeAndCopyImage( origName, userDirPath, function( err ){
            if( err )
              req.flash('error', err );
            else
              req.flash('notice', req.i18n.t('user.picture.upload.ok'));
            res.json({ success: true, flash: req.flash() });
          });
        });

      } // if xhr

    });

    /**
     * save the dimensions of the cropped image
     */
    app.put('/users/:id/change_pic_modal', auth.check, getUser, function( req, res ){
      if( !req.user ) return res.send('user not found');

      var userPicPath = path.join( iokit.config.datastore.absolutePath, 'users', req.user._id.toString() )

      req.user.picCropCoords = {
        x: parseInt(req.body.x),
        y: parseInt(req.body.y),
        w: parseInt(req.body.w),
        h: parseInt(req.body.h)
      };
      req.user.markModified('picCropCoords');
      req.user.save( function(err ){

        if( err ) req.flash('error', err);

        var execStr = ("convert " + path.join(userPicPath, 'profile_150.jpg') + 
          " -crop " + req.body.w + "x" + req.body.h + "+" + 
          req.body.x + "+" + req.body.y + " " + path.join(userPicPath, 'profile.jpg'));
        exec( execStr, function( err ) {
            if (err)
              req.flash('error', err);
            else
              req.flash('notice', req.i18n.t('user.picture.cropped_and_saved') );
            res.render( __dirname + '/views/users/change_pic_modal_update.ejs', {flash: req.flash(), user: req.user} );
        });

      });

    });

    /**
     * return the user's pic
     *
     */
    app.get('/users/:id/pic', getUser, function( req, res ){
      if( !req.user )
        return res.send( 'user not found' )
      var userPicPath = path.join( iokit.config.datastore.absolutePath, 'users', req.user._id.toString() );
      if( req.query.orig && req.query.orig === 'true' )
        userPicPath += '/profile_150.jpg';
      else
        userPicPath += '/profile.jpg';
      if( fs.existsSync( userPicPath ) )
        res.sendfile( userPicPath );
      else
        res.sendfile( path.normalize(__dirname + '/../../../public/images/user_256x256.png') );
    });

    /**
     * lists the users in a json
     * can also be used for autocompletion
     */
    app.get('/users:format?', auth.check, function( req, res ){
      res.format({
        html: function(){
          res.render( iokit.view.lookup( '/users/index.jade' ) );
        },
        json: function(){
          var q = User.find();
          if( req.query.online )
            q.where('lastRequest.createdAt').gte( moment().subtract('m', iokit.config.session.timeout.mins ) );
          q.exec( function( err, users ){
            if( err )
              res.json( { error: err } );
            else
              res.json({ data: users, success: (err===null) } );
          });
        }
      });
    });

    /**
     * load friends of currentUser
     */
    app.get('/users/friends.json', auth.check, function( req, res ){

      User.find().in('id', res.locals.currentUser.friends).exec( function( err, users ){
        if( err )
          req.flash('error', err);
        if( req.query.include_self )
          users.push( res.locals.currentUser );
        res.json({ success: (err===null), flash: req.flash(), users: users });
      });

    });

    /**
     * SHOW the user
     */
    app.get('/users/:id', auth.checkWithoutRedirect, getUser, function( req, res ){
      res.format({
        html: function(){
          if( !res.locals.currentUser )
            return res.send('alert("login required");');
          if( !req.user )
            return res.send( 'alert("user not found");' );
          res.render( iokit.view.lookup('users/show.jade'), {user: req.user, partialPath: __dirname + '/views/users/show.jade'} );
        },
        json: function(){
          if( !res.locals.currentUser )
            req.user = { name: { full: req.user.name.full }, _id: req.user._id };
          res.json( { user: req.user, success: (req.user !== null ) } );
        }
      });
    });

    /**
     * save changes to profile
     */
    app.put('/users/:id', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( req.body.user.name ){
          req.user.name.nick = req.body.user.name.nick;
          req.user.name.first = req.body.user.name.first;
          req.user.name.last = req.body.user.name.last;
        }
        if( res.locals.currentUser.roles.indexOf('manager') >= 0 && req.body.user.roles )
          req.user.roles = req.body.user.roles;
        if( req.body.user.preferences ){
          req.user.preferences = req.body.user.preferences;
          req.user.markModified('preferences');
        }
        req.user.save( function( err ){
          if( err ){
            console.log(err);
            req.flash('error', req.i18n.t('user.saving.failed'));
          } else
            req.flash('notice', req.i18n.t('user.saving.ok'));
          res.json({ success: (err===null), flash: req.flash(), user: req.user });
        });
      } else
        res.json({ success: false, flash: {error: [ req.i18n.t('user.not_found')]}});
    });

    /**
     * edit profile
     */
    app.get('/users/:id/edit', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( res.locals.currentUser.roles.indexOf('manager') >= 0 || req.user._id.toString() === res.locals.currentUser._id.toString() )
          res.render( __dirname + '/views/users/edit.ejs', { partialPath: __dirname + '/views/users/edit.jade', user: req.user } );
        else
          res.send('iokit.notify(\'error\',\'not allowed\');');
      } else
        res.send('iokit.notify(\'error\',\'user not found\');');
    });

    /**
     * shows the change_password dialog
     */
    app.get('/users/:id/change_password_modal', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( res.locals.currentUser.roles.indexOf('manager') >= 0 || req.user._id.toString() === res.locals.currentUser._id.toString() )
          res.render( __dirname + '/views/users/change_password_modal.ejs', { partialPath: __dirname + '/views/users/change_password_modal.jade', user: req.user } );
        else
          res.send('iokit.notify(\'error\',\'not allowed\');');
      } else
        res.send('iokit.notify(\'error\',\'user not found\');');
    });

    /**
     * shows the change_password dialog
     */
    app.put('/users/:id/change_password_modal', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( res.locals.currentUser.roles.indexOf('manager') >= 0 || req.user._id.toString() === res.locals.currentUser._id.toString() )
          if( ( req.body.old_password && req.user.authenticate( req.body.old_password ) ) || (res.locals.currentUser._id.toString() !== req.user._id.toString() && res.locals.currentUser.isAdmin() ) )
            if( req.body.password && req.body.password_confirm && req.body.password == req.body.password_confirm ){
              req.user.password = req.body.password;
              req.user.save( function( err ){
                if( err ) return res.send('iokit.notify(\'error\',\''+ err + '\');');
                res.send('iokit.notify({notice: [\''+ req.i18n.t('user.password_saved') + '\']}); iokit.modal(\'close\');');  
              });
            } else
              res.send('iokit.notify({error: [\''+ req.i18n.t('user.new_passwords_missmatch') + '\']});');
          else
            res.send('iokit.notify({error: [\''+ req.i18n.t('user.password_does_not_match') + '\']});');
        else
          res.send('iokit.notify({error: [\',\'not allowed\']});');
      } else
        res.send('iokit.notify({error: [\',\'user not found\']});');
    });

    app.delete('/users/:id', auth.check, auth.admin, getUser, function( req, res ){
      if( req.user ){
        if( req.user._id.toString() !== res.locals.currentUser._id.toString() ){
          req.flash('error', req.i18n.t('user.cannot_suspend_yourself'))
          return res.json( { flash: req.flash() } );
        }
        req.user.suspended = (typeof(req.user.suspended) === 'boolean' ? !req.user.suspended : true);
        req.user.save(function( err ){
          if( err )
            req.flash('error', req.i18n.t('user.suspending.failed', {name: req.user.name.full})+err );
          else
            req.flash('notice', req.i18n.t('user.suspending.'+(req.user.suspended ? 'ok' : 'restored'), {name: req.user.name.full}) );
          res.json( { flash: req.flash(), success: ( err === null ), suspended: ( req.user.suspended ) } );
        });
      }
    });

    app.post('/users/:id/docklets', auth.check, getUser, function( req, res ){
      if( req.user ){
        console.log('found user');
        if( req.user.preferences.docklets.indexOf( req.body.docklets ) < 0 ){
          console.log("adding")
          req.user.preferences.docklets.push( req.body.docklets );
          req.user.markModified('preferences');
        }
        req.user.save( function( err ){
          if( err ){
            console.log(err);
            req.flash('error', err);
          } else
            req.flash('notice', req.i18n.t('preferences.saved') );
          res.json( {flash: req.flash(), success: (err===null) });
        });
      } else{
        req.flash('error', 'user not found');
        res.json( { success: false } );
      }
    })

  },

  sidebarBottomWidget: true

}

function getUser( req, res, next ){
  User.findById( req.params.id, function( err, user ){
    if( err ) return res.send( err );
    req.user = user;
    next();
  })
}

function resizeAndCopyImage( origName, userDirPath, callback ){


  var resizeOpts = { src: origName, dst: path.join( userDirPath, 'profile_150.jpg' ), width: 150, height: 150 };
  easyimg.resize( resizeOpts, function( err, image ){
    util.pump( fs.createReadStream( path.join(userDirPath, 'profile_150.jpg') ),
      fs.createWriteStream(path.join( userDirPath, 'profile.jpg' )),
      callback( err )
    );
  });

}