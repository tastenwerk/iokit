var konter = require('konter')
  , fs = require('fs')
  , path = require('path')
  , jade = require('jade');

// internal modules
var auth = require( __dirname + '/../auth' )
  , inter = require( __dirname + '/../../../index')
  , File = require( __dirname + '/models/file' );

var filesPlugin = {

  models: {
    File: File
  },

  routes: function( app ){


    app.get('/upload', auth.check, function( req, res ){
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/new.jade' ) );
      partial = partial({ t: req.i18n.t });
      res.render( __dirname + '/views/new.ejs', { partial: partial } );      
    });

    app.post('/upload', auth.check, function( req, res ){

      for( var f in req.files ){
        var file = new File({ name: f, fileSize: req.files[f].size, contentType: req.files[f].type, holder: res.locals.currentUser, relativePath: (new Date()).getTime().toString(36), copyright: req.body.copyright, description: req.body.description, parent: req.body.parent })
        file.save( function( err ){
          console.log('file',f, err);
          if( err ){
            if( err.err && err.err.indexOf('duplicate key') > 0 )
              req.flash('error', req.i18n.t('files.already_exists_path', {name: f}) );
            else
              req.flash('error', require('util').inspect(err) );
            res.json({ flash: req.flash() });
          } else
            file.ancestors( function( err, ancestors ){
              if( err ){
                req.flash('error', err );
                res.json({ flash: req.flash() });
                console.log('error', err);
              } else{
                console.log(inter.config.datastore.absolutePath, 'abspath');
                fs.readFile(req.files[f].path, function (err, data) {
                  if( !fs.existsSync( inter.config.datastore.absolutePath ) )
                    fs.mkdirSync( inter.config.datastore.absolutePath );
                  var relPath = res.locals.currentUser.name.nick;
                  console.log('relpath', relPath);
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
              }  
            });
        })
      }

    });

  }

};

module.exports = exports = filesPlugin;