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
      console.log( fs.readFileSync( __dirname + '/views/new.jade' ) );
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/new.jade' ) );
      partial = partial({ t: req.i18n.t });
      res.render( __dirname + '/views/new.ejs', { partial: partial } );      
    });

    app.post('/upload', auth.check, function( req, res ){

      for( var f in req.files ){
        var file = new File({ name: f, holder: res.locals.currentUser, copyright: req.body.copyright, description: req.body.description, parent: req.body.parent })
        file.save( function( err ){
          if( err ){
            req.flash('error', err );
            res.json({ flash: req.flash() });
          } else
            file.ancestors( function( err, ancestors ){
              console.log('found', ancestors.length, 'ancs');
              if( err ){
                req.flash('error', err );
                res.json({ flash: req.flash() });
              } else          
                fs.readFile(req.files[f].path, function (err, data) {
                  if( !fs.existsSync( inter.config.datastore.absolutePath ) )
                    fs.mkdirSync( inter.config.datastore.absolutePath );
                  var relPath = res.locals.currentUser.name.nick;
                  if( !fs.existsSync( path.join(inter.config.datastore.absolutePath,relPath ) ) )
                    fs.mkdirSync( path.join(inter.config.datastore.absolutePath, relPath) );
                  for( var i=0; i < ancestors.length; i++ ){
                    for( var j=0; j <= i; j++)
                      relPath = path.join(relPath, ancestors[j].name);
                    if( !fs.existsSync( path.join( inter.config.datastore.absolutePath, relPath ) ) )
                      fs.mkdirSync(path.join( inter.config.datastore.absolutePath, relPath ) );
                  }
                  relPath = path.join(relPath, f);
                  console.log('relPath', relPath);
                  fs.writeFile( path.join( inter.config.datastore.absolutePath, relPath ), data, function (err) {
                    file.relativePath = relPath;
                    file.save( function( err ){
                      if( err )
                        req.flash('error', req.i18n.t('files.failed_to_save_rel_path', {name: file.name}));
                      else
                        req.flash('notice', req.i18n.t('files.success', {name: file.name}));
                      res.json({ flash: req.flash() });
                    });
                  });
                });  
            });
        })
      }

    });

  }

};

module.exports = exports = filesPlugin;