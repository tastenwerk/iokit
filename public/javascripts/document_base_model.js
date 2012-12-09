function DocumentBaseModel( self ){

  return {
    
    // -------------------------------------------------------- PUBLIC STATUS */
    /**
     * changes the public status and commits
     * status to server
     */
    changePublicStatus: function changePublicStatus( model, e ){
      $.ajax({ url: '/documents/'+self._id+'/change_public_status.json', 
                type: 'put',
                dataType: 'json',
                data: { _csrf: $('#_csrf').val() },
                success: function( data ){
                  if( data.success ){
                    self.published( data.published );
                    if( data.published )
                      $(e.target).removeClass('locked').text($.i18n.t('document.published'));
                    else
                      $(e.target).addClass('locked').text($.i18n.t('document.locked'));
                    inter.notify( data.flash );
                  } else
                    inter.notify({ error: $.i18n.t('document.publishing_failed_unknown')});
                }
      })
    },

    // -------------------------------------------------------- HUMAN readable PATH
    humanReadablePath: ko.observable(''),
    humanReadablePathTrunc: ko.observable(''),

    /*
     * load publicPath for this model
     * immediately
     */
    loadHumanReadablePath: function loadHumanReadablePath(){
      $.getJSON( '/documents/'+self._id+'/human_readable_path', function( data ){
        if( data.success ){
          self.humanReadablePath(data.humanReadablePath);
          if( self.humanReadablePath.length > 30 )
            self.humanReadablePathTrunc(self.humanReadablePath().substr(0,30));
          else
            self.humanReadablePathTrunc(self.humanReadablePath);
        } else
          inter.notify( data.flash );
      });
    },

    isImage: function(){
      return ( self.contentType() && self.contentType().indexOf('image') === 0 );
    },

    saveName: function(){
    },

    renameItem: function(){
      var renameForm = $('<form class="content-padding" data-bind="submit: saveName"/>');
      renameForm.append($('<p/>').append('<label>'+$.i18n.t('name')+'</label>')
                .append('<input type="text" data-bind="value: name" />'));
      inter.modal({title: $.i18n.t('rename_item', {name: self.name}),
                   data: renameForm,
                   completed: function( modal ){
                    modal.find('.js-get-focus').focus();
                   },
                   windowControls: {
                      save: {
                        icn: 'icn-save',
                        title: $.i18n.t('save'),
                        callback: function( modal ){
                          modal.find('form').submit();
                          inter.modal('close');
                        }
                      }
                    }
      });
    }
  }

}