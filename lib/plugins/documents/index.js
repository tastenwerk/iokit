/**
 *
 * documents (general CRUD operations)
 *
 */

var konter = require('konter')
  , auth = require( __dirname + '/../auth' );

module.exports = exports = {
  
  routes: function( app ){


    app.get('/documents', auth.check, function( req, res ){
      var q = {}
      if( req.query.parentId )
        q = {paths: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
      if( req.query.roots )
        q = {paths: []};
        //q = {_id: konter.mongoose.Types.ObjectId( req.query._id ) };
      konter.findAnyWithUser( res.locals.currentUser, q, function( err, docs ){
        if( err ) return res.json({error: err});
        res.json( { results: docs } );
      });

    });

    app.put( '/documents/:id/change_public_status:format?', auth.check, getDocument, function( req, res ){
      res.format({
        json: function(){
          if( req.doc )
            if( req.doc.canWrite() ){
              if( req.doc.published )
                req.doc.unshare( konter.mongoose.models.User.anybody );
              else
                req.doc.share( konter.mongoose.models.User.anybody, 'r' );
              req.doc.save( function( err ){
                if( err )
                  req.flash('error', err);
                else
                  if( req.doc.published )
                    req.flash('notice', req.i18n.t('document.has_been_published', {name: req.doc.name}));
                  else
                    req.flash('notice', req.i18n.t('document.has_been_locked', {name: req.doc.name}));
                res.json( { published: req.doc.published, success: (err === null), flash: req.flash() } );
              })
            } else
              req.flash('error', req.i18n.t('security_transgression', {name: req.doc.name}))
          else
            req.flash('error', req.i18n.t('not_found') );
        }
      });
    });

    app.get( '/documents/:id:format?', auth.check, getDocument, function( req, res ){
      res.format({
        json: function(){
          res.json( req.doc );
        }
      });
    });

    app.post( '/documents/sort', auth.check, function( req, res ){
      var pos = 0
        , documents = [];
      function updateNextDocument(){
        documents[ pos ].pos = pos;
        if( req.body.path )
          documents[ pos ].paths = [ req.body.path ];
        else
          documents[ pos ].paths = [];
        //documents[ pos ].markModified('paths');

        documents[ pos ].save( function( err ){
          if( err ) return res.json( { success: false } );
          if( ++pos < documents.length )
            updateNextDocument();
          else{
            req.flash( 'notice', req.i18n.t('document.order.saving.ok') ); 
            res.json( { success: true, flash: req.flash() });
          }
        })
      }
      var ids = req.body.ids.split(',').map(function( item ){ return konter.mongoose.Types.ObjectId( item ); });
      konter.findAnyWithUser( res.locals.currentUser, { _id: {$in: ids} }, function( err, docs ){
        for( var i=0, id; id=ids[i]; i++ )
          for( var j=0, d; d=docs[j]; j++)
            if( d._id.toString() === id.toString() )
              documents.push( d )
        updateNextDocument();
      });
    });

    app.delete('/documents/:id', auth.check, function( req, res ){

      konter.firstAnyWithUser( res.locals.currentUser, { _id: konter.mongoose.Types.ObjectId( req.params.id ) }, function( err, doc ){
        if( err ){
          req.flash('error', err );
          res.json( {flash: req.flash() } );
        } else if( !doc ){
          req.flash('error', req.i18n.t('not_found') );
          res.json( {flash: req.flash() } );
        } else if( !doc.canDelete() ){
          req.flash('error', req.i18n.t('removeing.denied', {name: doc.name}) );
          res.json( {flash: req.flash() } );
        } else
          doc.remove( function( err ){
            if( err )
              req.flash('error', req.i18n.t('removing.failed', {name: doc.name}));
            else
              req.flash('notice', req.i18n.t('removing.ok', {name: doc.name}));
            res.json( { flash: req.flash(), success: ( err === null ) } );
          })
      });

    });

  }

}

// add document's view path to the global scope
inter.view.paths.push( __dirname + '/views' );

function getDocument( req, res, next ){
  konter.firstAnyWithUser( res.locals.currentUser, { 
    _id: konter.mongoose.Types.ObjectId( req.params.id ) }, 
    function( err, doc ){
      req.doc = doc;
      next();
  });
}