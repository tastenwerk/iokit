/**
 * IO comment model
 */
IOComment = function( attrs, parent ){
  var self = this;
  self.createdAt = new Date();
  $.extend( this, DocumentBaseModel(self) );

  for( var i in attrs )
    if( !i.match(/_id|_user/) )
      self[i] = ko.observable(attrs[i]);
    else
      self[i] = attrs[i];

  self.saveComment = function(){
    if( !self._id )
      $.ajax({ url: '/documents/'+parent._id+'/comments',
               type: 'post',
               data: { _csrf: $('#_csrf').val(),
                        comment: {
                          content: self.content()
                        }
                      },
               success: function( response ){
                if( response.success ){
                  self._id = response.commentId;
                  self._user = response._user;
                  parent.comments.push( self );
                }
               }
      });  
  };

}