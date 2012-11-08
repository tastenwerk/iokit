var konter = require('konter')
  , fs = require('fs')
  , jade = require('jade');

// internal modules
var auth = require( __dirname + '/../auth' );

/**
 * the Folder model
 * is meant to help organizing
 * files and categorize them
 */

var FolderSchema = konter.mongoose.Schema({ color: String, settings: {type: konter.mongoose.Schema.Types.Mixed, default: {}}, })
FolderSchema.plugin( konter.plugin );
var Folder = konter.mongoose.model( 'Folder', FolderSchema );

var foldersPlugin = {

  models: {
    Folder: Folder
  },

  routes: function( app ){

    /*
     * renders folder view
     * or returns json
     *
     * js: renders the folders view (with a tree)
     *
     * json: returns a list of folders
     */
    app.get('/folders', auth.check, function( req, res ){

      res.format({

        js: function(){
          res.send('');
        },

        json: function(){
          Folder.find().execWithUser( req.user, function( err, folders ){
            if( err ) return res.json({error: err});
            res.json( folders );
          });

        }

      });

    });

    /**
     * creates a new folder
     */
    app.post('/folders', auth.check, function( req, res ){

      console.log( req.body.folder );

      req.body.folder.holder = req.user;
      var folder = new Folder( req.body.folder );
      console.log(folder.paths);
      folder.save( function( err ){
        console.log(err);
        err 
          ? req.flash('error', req.i18n.t('creation.failed') + ' ('+err+')')
          : req.flash('notice', req.i18n.t('creation.ok', {name: folder.name} ) );
        res.render( __dirname + '/views/create.ejs', { flash: req.flash() } );
      });
    });

    app.get('/folders/new', auth.check, function( req, res ){
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/new.jade' ) );
      partial = partial({ folder: (new Folder()).toJSON(), t: req.i18n.t });
      res.render( __dirname + '/views/new.ejs', { partial: partial } );
    });

    app.get('/folders/sidebar_content', auth.check, function( req, res ){
      res.render( __dirname + '/views/sidebar_content' );
    });

  },

  sidebarWidget: {
    sidebarRemote: true
  }

}

module.exports = exports = foldersPlugin;