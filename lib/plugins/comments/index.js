/**
 *
 * comments (general CRUD operations)
 *
 */

var iomapper = require('iomapper')
  , path = require('path')
  , auth = require( __dirname + '/../auth' );

module.exports = exports = {
  
  routes: function( app ){

    app.post( '/documents/:id/comments', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        var commentDefault = req.body.comment;
        commentDefault._user = res.locals.currentUser;
        req.doc.comments.push( commentDefault );
        req.doc.save( function( err ){
          if( err )
            req.flash('error', req.i18n.t('comments.posting.failed') );
          else
            req.flash('notice', req.i18n.t('comments.posting.ok') );
          res.json({ flash: req.flash(), success: (err===null), commentId: req.doc.comments[req.doc.comments.length-1]._id, _user: res.locals.currentUser });
        });
      } else{
        req.flash('error', req.i18n.t('not_found'));
        res.json({ flash: req.flash(), success: false })
      }
    })
  }

}

// add document's view path to the global scope
iokit.view.paths.push( __dirname + '/views' );

function getDocument( req, res, next ){
  iomapper.firstAnyWithUser( res.locals.currentUser, { 
    _id: iomapper.mongoose.Types.ObjectId( req.params.id ) }, 
    function( err, doc ){
      req.doc = doc;
      next();
  });
}