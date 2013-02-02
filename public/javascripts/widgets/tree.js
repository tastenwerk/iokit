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

        if( options.deleteSelected && typeof(options.deleteSelected === 'function' ))
          return options.deleteSelected( tree, item, e );
        for( var i in tree.treeViewModel.selectedItems() )
          $.ajax({ url: options.saveUrl+tree.treeViewModel.selectedItems()[i]._id,
                   type: 'delete',
                   dataType: 'json',
                   data: { _csrf: $('#_csrf').val() },
                   success: function( response ){
                      if( response.success ){
                        tree.treeViewModel.items.remove( tree.treeViewModel.selectedItems()[i] );
                        tree.treeViewModel.selectedItems.remove( tree.treeViewModel.selectedItems()[i] );
                      }
                      iokit.notify( response.flash );
                   }
          });
      },

      /**
       * returns a new data item
       */
      newItemForm: options.newItemForm || function( item, e ){
        var form = $('.iokit-content:visible .item-form');
        $('.iokit-content:visible .click-for-details').hide();
        $(e.target).closest('.iokit-tree').find('.selected').removeClass('selected');
        form.find('.click-for-details').hide();
        ko.cleanNode( form.get(0) );
        ko.applyBindings( this.newItem(), form.get(0) );
        form.find('.top-tabs').iokitTopTabs();
        form.fadeIn(200);
        setTimeout( function(){
          form.find('input[type=text]:first').focus();
          if( options.afterShowForm && typeof(options.afterShowForm) === 'function' )
            options.afterShowForm(item, form );
        },200);
      },

      newItem: function(){
        return new tree.TreeItemModel( options.defaultValues || {} );
      }

    };

    tree.TreeItemModel = function( data ){
      var self = this;        
      $.extend( this, DocumentBaseModel(self) );

      self.children = ko.observableArray([]);
      self.comments = ko.observableArray([]);

      if( options.saveAttrs )
        for( var i in options.saveAttrs )
          self[options.saveAttrs[i]] = ko.observable(null);

      for( var i in data )
        if( i === 'comments' )
          for( var j=data.comments.length-1,comment; comment=data.comments[j]; j-- ){
            self.comments.push( new IOComment( comment, self ) );
          }
        else if( i.match(/_id|acl|createdAt|updatedAt|holder/) )
          self[i] = data[i];
        else if( data[i] instanceof Array )
          self[i] = ko.observableArray(data[i]);
        else
          self[i] = ko.observable(data[i]);

      self.showForm = options.showForm || function showForm( item, e ){
        $('.iokit-content:visible .click-for-details').hide();
        var form = $('.iokit-content:visible .item-form');
        ko.cleanNode( form.get(0) );
        ko.applyBindings( this, form.get(0) );
        form.find('.top-tabs').iokitTopTabs();
        form.fadeIn(200);
        if( e ){
          $(e.target).closest('.tree-content').find('.selected').removeClass('selected');
          $(e.target).closest('li').addClass('selected');
        }
        if( options.afterShowForm && typeof(options.afterShowForm) === 'function' )
          options.afterShowForm(self, form );
      };

      self._ajaxSaveForm = function( data ){

        if( self._id )
          $.ajax({ url: options.saveUrl+self._id,
                   data: data,
                   type: 'put',
                   dataType: 'json',
                   success: function( response ){
                     iokit.notify( response.flash );
                   }
          })
        else
          $.ajax({ url: options.saveUrl,
                   data: data,
                   type: 'post',
                   dataType: 'json',
                   success: function( response ){
                     if( response.success ){
                       var newItem = new tree.TreeItemModel( response[ options.saveKey ] )
                       tree.treeViewModel.items.push( newItem );
                       newItem.showForm();
                     }
                     iokit.notify( response.flash );
                   }
          });

      }

      self.saveForm = options.saveForm || function saveForm( form ){
        var data = { _csrf: $('#_csrf').val() };
        data[ options.saveKey ] = {};
        for( var i in options.saveAttrs )
          data[ options.saveKey ][ options.saveAttrs[i] ] = self[options.saveAttrs[i]]();
        if( options && typeof( options.beforeSave ) === 'function' )
          options.beforeSave.call( self, form, data, self._ajaxSaveForm );
        else
          self._ajaxSaveForm( data );
      };

      self.submitSaveForm = options.submitSaveForm || function submitSaveForm( item, e ){
        this.saveForm( $(e.target).closest('.item-form').find('form') );
      };

      self.hideForm = options.hideForm || function hideForm( item, e ){
        $(e.target).closest('.item-form').fadeOut();
        $(e.target).closest('.item-form').prev('.no-item-form').fadeIn( 200 );
      }

      self.markSelected = options.markSelected || function markSelected(elem, e){
        if( $(e.target).hasClass('tree-trigger') )
          return;
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


      /**
       * toggles all children of this node
       */       
      self.toggleChildren = function( model, e ){
        if( $(e.target).hasClass('open') ){
          $(e.target).removeClass('open');
          self.children.removeAll();
          return;
        }
        $(e.target).addClass('loading');
        $.getJSON( '/webpages.json?parentId='+model._id, function( data ){
          self.children.removeAll();
          if( data.length === 0 )
            $(e.target).removeClass('loading').css('opacity',0);
          for( var i in data )
            self.children.push( new tree.TreeItemModel( data[i] ) );
          $(e.target).removeClass('loading').addClass('open');
        });
      };

      /**
       * helper sort function
       */
      self.sortFunction = function(a, b) {
        return (a.pos && b.pos ? ((a.pos > b.pos) ? 1 : -1) : (typeof(a.pos) !== 'undefined' || typeof(b.pos) !== 'undefined' ) );
      };

      /**
       * returns children sorted by given sort order
       */
      self.sortedChildren = ko.dependentObservable( function() {
        return self.children.slice().sort(self.sortFunction);
      }, self );


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