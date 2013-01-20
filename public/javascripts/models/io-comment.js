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

  self.saveComment = function( form ){
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
                  parent.comments.unshift( self );
                }
                iokit.notify( response.flash );
               }
      });
    else
      $.ajax({ url: '/documents/'+parent._id+'/comments/'+self._id,
              data: { _csrf: $('#_csrf').val(), comment: { content: self.content() } },
              type: 'put',
              success: function( response ){
                if( response.success ){
                  var elem = $(form).closest('.comment-item');
                  self.toggleCommentForm( elem );
                }
                iokit.notify( response.flash );

              }
      });
  };

  self.removeComment = function(){
    $.ajax({  url: '/documents/'+parent._id+'/comments/'+self._id,
              data: { _csrf: $('#_csrf').val() },
              type: 'delete',
              success: function( response ){
                if( response.success )
                  parent.comments.remove( self );
                iokit.notify( response.flash );
              } 
    });
  };

  self.toggleEditComment = function( obj, e ){
    self.toggleCommentForm( $(e.target).closest('.comment-item') );
  };

  self.toggleCommentForm = function( elem ){
    console.log(elem);
    elem.find('.content-view').toggle();
    elem.find('.content-edit').slideToggle(200);
    setTimeout(function(){ elem.find('textarea').focus(); }, 200);
  }

  self.simpleFormattedContent = ko.computed( function(){
    return self.content().replace(/\n/g, "<br />");
  });

}