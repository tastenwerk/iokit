var iomapper = require('iomapper')
  , fs = require('fs')
  , path = require('path')
  , url = require('url')
  , jade = require('jade');

// iokitnal modules
var auth = require( __dirname + '/../auth' )
  , iokit = require( __dirname + '/../../../index')
  , File = require( __dirname + '/models/file' );

var filesPlugin = {

  models: {
    File: File
  },

  routes: function( app ){

    /**
     * catch anything starting with files
     */
    app.get('/files/:id*', auth.checkWithoutRedirect, function( req, res ){
      var user = res.locals.currentUser || iomapper.mongoose.models.User.anybody;
      if( req.url.replace('/files/','').indexOf('/') < 0 )
        File.findById( iomapper.mongoose.Types.ObjectId( req.params.id ) ).execWithUser( user, function( err, file ){
          if( err ) return res.send(404);
          if( file ){
            res.setHeader('Content-Type', file.contentType);
            res.sendfile( path.join( iokit.config.datastore.absolutePath, 'files', file._id.toString().substr(11,2), file._id.toString(), 'orig' ) );
          }
          else
            findFileByNameAndAncestors( user, req, res );
        });
      else
        findFileByNameAndAncestors( user, req, res );
    });

    app.get('/upload', auth.check, function( req, res ){
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/new.jade' ) );
      partial = partial({ t: req.i18n.t });
      res.render( __dirname + '/views/new.ejs', { partial: partial } );      
    });

  }

};

function findFileByNameAndAncestors( user, req, res ){
  var paths = req.url.replace('/files/','').split('/');
  console.log('finding...', paths)
  File.find({ name: paths[paths.length-1] }).execWithUser( user, function( err, files ){
    console.log('found', files.length);
    if( files.length === 1 ){
      res.setHeader('Content-Type', files[0].contentType);
      res.sendfile( path.join( iokit.config.datastore.absolutePath, 'files', files[0]._id.toString().substr(11,12), files[0]._id.toString(), 'orig' ) );
    } else
      iomapper.firstAnyWithUser( user, { name: paths[0], paths: [] }, function( err, doc ){
        if( err ){ console.log(err); return res.send(500) }
        if( doc ){
          for( var i=0,file; file=files[i]; i++ )
            for( var j=0,filePath; filePath=file.paths[j]; j++ )
              if( filePath.indexOf( doc._id.toString() ) >= 0 ){
                res.setHeader('Content-Type', files[0].contentType);
                return res.sendfile( path.join( iokit.config.datastore.absolutePath, 'files', file._id.toString().substr(11,12), file._id.toString(), 'orig' ) );
              }
          res.send(404);
        } else
          res.send(404);
      });
  });
}

module.exports = exports = filesPlugin;