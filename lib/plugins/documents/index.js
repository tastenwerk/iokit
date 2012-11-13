/**
 *
 * documents (general CRUD operations)
 *
 */

var konter = require('konter')
  , auth = require( __dirname + '/../auth' );

module.exports = exports = {
  
  routes: function( app ){

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
            console.log('removed');
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