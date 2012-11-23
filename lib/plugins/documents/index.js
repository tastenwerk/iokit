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
        //q = {_id: konter.mongoose.Types.ObjectId( req.query._id ) };
      konter.findAnyWithUser( res.locals.currentUser, q, function( err, docs ){
        if( err ) return res.json({error: err});
        res.json( { results: docs } );
      });

    });

    app.get( '/documents/:id:format?', auth.check, getDocument, function( req, res ){
      res.format({
        json: function(){
          res.json( req.doc );
        }
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
            res.json( {flash: req.flash() } );
          })
      });

    });

  }

}

function getDocument( req, res, next ){
  konter.firstAnyWithUser( res.locals.currentUser, { 
    _id: konter.mongoose.Types.ObjectId( req.params.id ) }, 
    function( err, doc ){
      req.doc = doc;
  });
}