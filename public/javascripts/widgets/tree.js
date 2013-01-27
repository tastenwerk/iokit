/**
 *
 * iokit-tree
 * builds a default tree (usually used in iokit-sidebar)
 *
 */

$(function(){

  $.fn.iokitTree = function iokitTree( options ){

    var tree = $(this);

    tree.treeViewModel = {

      items: ko.observableArray( [] ),

      /**
       * reload or initially fetch data
       * from given url or options.url
       */
      fetchData: function( url ){
        url = url || options.url;
        $.getJSON( options.url, function( json ){
          if( json.success ){
            tree.treeViewModel.items.removeAll();
            for( var i in json.data )
              tree.treeViewModel.items.push( new tree.TreeItemModel( json.data[i] ) );
          } else
            iokit.notify( json.flash );
        });
      },

      selectedItems: ko.observableArray( [] ),

      /**
       * delete selected data items
       */
      deleteSelected: function( item, e ){
        if( options.deleteSelected )
          return options.deleteSelected( tree, item, e );
        for( var i in tree.treeViewModel.selectedItems() )
          $.ajax({ url: '/documents/'+tree.treeViewModel.selectedItems()[i]._id,
                   type: 'delete',
                   dataType: 'json',
                   data: { _csrf: $('#_csrf').val() },
                   success: function( response ){
                      if( response.success ){
                        tree.treeViewModel.selectedItems.remove( tree.treeViewModel.selectedItems()[i] );
                        tree.treeViewModel.items.remove( tree.treeViewModel.selectedItems()[i] );
                      }
                      iokit.notify( response.flash );
                   }
          });
      }

    };

    tree.TreeItemModel = function( data ){
      var self = this;        
      $.extend( this, DocumentBaseModel(self) );

      self.children = ko.observableArray([]);
      self.comments = ko.observableArray([]);

      for( var i in data )
        if( i === 'comments' )
          for( var j=data.comments.length-1,comment; comment=data.comments[j]; j-- ){
            self.comments.push( new IOComment( comment, self ) );
          }
        else if( i.match(/_id|acl|createdAt|updatedAt|holder|tags/) )
          self[i] = data[i];
        else
          self[i] = ko.observable(data[i]);

      self.showForm = options.showForm || function showForm(){
        alert('showForm is not implemented');
      };

      self.markSelected = options.markSelected || function markSelected(elem, e){
        var treeItem = self.getTreeItem( e );
        if( treeItem.hasClass('selected') )
          tree.treeViewModel.selectedItems.remove( this );
        else
          tree.treeViewModel.selectedItems.push( this );
        treeItem.toggleClass('selected');
      }

      self.getTreeItem = function getTreeItem( e ){
        var treeItem = $(e.target).closest('.tree-item');
        if( $(e.target).hasClass('tree-item') )
          treeItem = $(e.target)
        return treeItem;
      }

    }

    if( options.before && typeof(options.before) === 'function' )
      options.before( tree );

    if( !tree.attr('id') )
      tree.attr('id', 'tree-'+(new Date()).getTime().toString(36));

    ko.applyBindings( tree.treeViewModel, tree.get(0) );

    if( options.url )
      tree.treeViewModel.fetchData();

    if( options.after && typeof(options.after) === 'function' )
      options.after( tree );

  }

});