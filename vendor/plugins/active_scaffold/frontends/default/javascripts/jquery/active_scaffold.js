$(document).ready(function() {
  $('form.as_form').live('ajax:loading', function(event) {
    var as_form = $(this).closest("form");
    if (as_form && as_form.attr('data-loading') == 'true') {
      ActiveScaffold.disable_form(as_form);
    }
    return true;
  });
  
  $('form.as_form').live('ajax:complete', function(event) {
    var as_form = $(this).closest("form");
    if (as_form && as_form.attr('data-loading') == 'true') {
      ActiveScaffold.enable_form(as_form);
    }
  });
  $('form.as_form').live('ajax:failure', function(event) {
    var as_div = $(this).closest("div.active-scaffold");
    if (as_div) {
      ActiveScaffold.report_500_response(as_div)
    }
  });
  $('form.as_form.as_remote_upload').live('submit', function(event) {
    var as_form = $(this).closest("form");
    if (as_form && as_form.attr('data-loading') == 'true') {
      setTimeout("ActiveScaffold.disable_form('" + as_form.attr('id') + "')", 10);
    }
    return true;
  });
  $('a.as_action').live('ajax:before', function(event) {
    var action_link = ActiveScaffold.ActionLink.get($(this));
    if (action_link) {
      if (action_link.is_disabled()) {
        return false;
      } else {
        if (action_link.loading_indicator) action_link.loading_indicator.css('visibility','visible');
        action_link.disable();
      }
    }
    return true;
  });
  $('a.as_action').live('ajax:success', function(event, response) {
    var action_link = ActiveScaffold.ActionLink.get($(this));
    if (action_link) {
      if (action_link.position) {
        action_link.insert(response);
        if (action_link.hide_target) action_link.target.hide();
      } else {
        action_link.enable();
      }
      return true;
    }
    return true;
  });
  $('a.as_action').live('ajax:complete', function(event) {
    var action_link = ActiveScaffold.ActionLink.get($(this));
    if (action_link) {
      if (action_link.loading_indicator) action_link.loading_indicator.css('visibility','hidden');  
    }
    return true;
  });
  $('a.as_action').live('ajax:failure', function(event) {
    var action_link = ActiveScaffold.ActionLink.get($(this));
    if (action_link) {
      ActiveScaffold.report_500_response(action_link.scaffold_id());
      action_link.enable();
    }
    return true;
  });
  $('a.as_cancel').live('ajax:before', function(event) {
    var as_cancel = $(this);
    var action_link = ActiveScaffold.find_action_link(as_cancel);  
    
    if (action_link) {
      var cancel_url = as_cancel.attr('href');
      var refresh_data = as_cancel.attr('data-refresh');
      if (refresh_data === 'true' && action_link.refresh_url) {
        event.data_url = action_link.refresh_url;
        if (action_link.position) event.data_type = 'html' 
      } else if (refresh_data === 'false' || typeof(cancel_url) == 'undefined' || cancel_url.length == 0) {
        action_link.close();
        return false;
      }
    }
    return true;
  });
  $('a.as_cancel').live('ajax:success', function(event, response) {
    var action_link = ActiveScaffold.find_action_link($(this));

    if (action_link) {
      if (action_link.position) {
        action_link.close(response);
      } else {
        response.evalResponse(); 
      }
    }
    return true;
  });
  $('a.as_cancel').live('ajax:failure', function(event) {
    var action_link = ActiveScaffold.find_action_link($(this));
    if (action_link) {
      ActiveScaffold.report_500_response(action_link.scaffold_id());
    }
    return true;
  });
  $('a.as_sort').live('ajax:before', function(event) {
    var as_sort = $(this);
    var history_controller_id = as_sort.attr('data-page-history');
    if (history_controller_id) addActiveScaffoldPageToHistory(as_sort.attr('href'), history_controller_id);
    as_sort.closest('th').addClass('loading');
    return true;
  });
  $('a.as_sort').live('ajax:failure', function(event) {
    var as_scaffold = $(this).closest('.active-scaffold');
    ActiveScaffold.report_500_response(as_scaffold);
    return true;
  });
  $('span.in_place_editor_field').live('hover', function(event) {
    $(this).data(); // jquery 1.4.2 workaround
    if (event.type == 'mouseenter') {
      if (typeof($(this).data('editInPlace')) === 'undefined') $(this).addClass("hover");
     }
    if (event.type == 'mouseleave') {
      if (typeof($(this).data('editInPlace')) === 'undefined') $(this).removeClass("hover");
    }
    return true;
  });
  $('span.in_place_editor_field').live('click', function(event) {
    var span = $(this);
    span.data(); // jquery 1.4.2 workaround
    if (typeof(span.data('editInPlace')) === 'undefined') {
      var options = {show_buttons: true,
                     hover_class: 'hover',
                     element_id: 'editor_id',
                     ajax_data_type: "script",
                     update_value: 'value'},
          csrf_param = $('meta[name=csrf-param]').first(),
          csrf_token = $('meta[name=csrf-token]').first(),
          my_parent = span.parent(),
          column_heading = null;
      
      if (my_parent.is('td')) {
        var column_no = my_parent.prevAll('td').length;
        column_heading = my_parent.closest('.active-scaffold').find('th:eq(' + column_no + ')');
      } else if (my_parent.is('th')) {
        column_heading = my_parent;
      }
        
      var render_url = column_heading.attr('data-ie_render_url'),
          mode = column_heading.attr('data-ie_mode'),
          record_id = span.attr('data-ie_id');
          
      ActiveScaffold.read_inplace_edit_heading_attributes(column_heading, options);
      
      if (span.attr('data-ie_url')) { 
        options.url = span.attr('data-ie_url').replace(/__id__/, record_id);
      } else { 
        options.url = column_heading.attr('data-ie_url').replace(/__id__/, record_id);
      }
      
      if (csrf_param) options['params'] = csrf_param.attr('content') + '=' + csrf_token.attr('content');
            
      if (mode === 'clone') {
        options.clone_id_suffix = record_id;
        options.clone_selector = '#' + column_heading.attr('id') + ' .as_inplace_pattern';
        options.field_type = 'clone';
      }
      
      if (render_url) {
        var plural = false;
        if (column_heading.attr('data-ie_plural')) plural = true;
        options.field_type = 'remote';
        options.editor_url = render_url.replace(/__id__/, record_id) 
      }
      if (mode === 'inline_checkbox') {
        ActiveScaffold.process_checkbox_inplace_edit(span.find('input:checkbox'), options);
      } else {
        ActiveScaffold.create_inplace_editor(span, options);
      }
    }
  });
  $('a.as_paginate').live('ajax:before',function(event) {
    var as_paginate = $(this);
    var history_controller_id = as_paginate.attr('data-page-history');
    if (history_controller_id) addActiveScaffoldPageToHistory(as_paginate.attr('href'), history_controller_id);
    as_paginate.prevAll('img.loading-indicator').css('visibility','visible');
    return true;
  });
  $('a.as_paginate').live('ajax:failure', function(event) {
    var as_scaffold = $(this).closest('.active-scaffold');
    ActiveScaffold.report_500_response(as_scaffold);
    return true;
  });
  $('a.as_paginate').live('ajax:complete', function(event) {
    $(this).prevAll('img.loading-indicator').css('visibility','hidden');
    return true;
  });
  $('input[type=button].as_add_existing').live('ajax:before', function(event) {
    var url = $(this).attr('href').replace('--ID--', $(this).prev().val());
    event.data_url = url;
    return true;
  });
  $('input.update_form, select.update_form').live('change', function(event) {
      var element = $(this);
      var as_form = element.closest('form.as_form');
      $.ajax({
        url: element.attr('data-update_url'),
        data: {value: element.val()},
        beforeSend: function(event) {
          element.nextAll('img.loading-indicator').css('visibility','visible');
          $('input[type=submit]', as_form).attr('disabled', 'disabled');
          $("input:enabled,select:enabled", as_form).attr('disabled', 'disabled');
        },
        complete: function(event) {
          element.nextAll('img.loading-indicator').css('visibility','hidden');
          $('input[type=submit]', as_form).attr('disabled', '');
          $("input:disabled,select:disabled", as_form).attr('disabled', '');
        },
        error: function (xhr, status, error) {
          var as_div = element.closest("div.active-scaffold");
          if (as_div) {
            ActiveScaffold.report_500_response(as_div)
          }
        }
      });
    return true;
  });
  
  $('select.as_search_range_option').live('change', function(event) {
    ActiveScaffold[$(this).val() == 'BETWEEN' ? 'show' : 'hide']($(this).parent().find('.as_search_range_between'));
    return true;
  });
  
  $('select.as_search_range_option').live('change', function(event) {
    var element = $(this);
    ActiveScaffold[!(element.val() == 'PAST' || element.val() == 'FUTURE' || element.val() == 'RANGE') ? 'show' : 'hide'](element.attr('id').replace(/_opt/, '_numeric'));
    ActiveScaffold[(element.val() == 'PAST' || element.val() == 'FUTURE') ? 'show' : 'hide'](element.attr('id').replace(/_opt/, '_trend'));
    ActiveScaffold[(element.val() == 'RANGE') ? 'show' : 'hide'](element.attr('id').replace(/_opt/, '_range'));
    return true;
  });
  
});

/* Simple Inheritance
 http://ejohn.org/blog/simple-javascript-inheritance/
*/
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();


/*
 * Simple utility methods
 */

var ActiveScaffold = {
  records_for: function(tbody_id) {
    if (typeof(tbody_id) == 'string') tbody_id = '#' + tbody_id;
    return $(tbody_id).children('.record');
  },
  stripe: function(tbody_id) {
    var even = false;
    var rows = this.records_for(tbody_id);
    
    rows.each(function (index, row_node) {
      row = $(row_node);
      if (row_node.tagName != 'SCRIPT'
        && !row.hasClass("create")
        && !row.hasClass("update")
        && !row.hasClass("inline-adapter")
        && !row.hasClass("active-scaffold-calculations")) {

        if (even) row.addClass("even-record");
        else row.removeClass("even-record");

        even = !even;
      }  
    });
  },
  hide_empty_message: function(tbody) {
    if (this.records_for(tbody).length != 0) {
      var empty_message_node = $(tbody).parent().find('tbody.messages p.empty-message')
      if (empty_message_node) empty_message_node.hide();
    }
  },
  reload_if_empty: function(tbody, url) {
    if (this.records_for(tbody).length == 0) {
      $.getScript(url);
    }
  },
  removeSortClasses: function(scaffold) {
    if (typeof(scaffold) == 'string') scaffold = '#' + scaffold;
    scaffold = $(scaffold)
    scaffold.find('td.sorted').each(function(element) {
      element.removeClass("sorted");
    });
    scaffold.find('th.sorted').each(function(element) {
      element.removeClass("sorted");
      element.removeClass("asc");
      element.removeClass("desc");
    });
  },
  decrement_record_count: function(scaffold) {
    // decrement the last record count, firsts record count are in nested lists
    if (typeof(scaffold) == 'string') scaffold = '#' + scaffold; 
    scaffold = $(scaffold)
    count = scaffold.find('span.active-scaffold-records').last();
    if (count) count.html(parseInt(count.html(), 10) - 1);
  },
  increment_record_count: function(scaffold) {
    // increment the last record count, firsts record count are in nested lists
    if (typeof(scaffold) == 'string') scaffold = '#' + scaffold;
    scaffold = $(scaffold)
    count = scaffold.find('span.active-scaffold-records').last();
    if (count) count.html(parseInt(count.html(), 10) + 1);
  },
  update_row: function(row, html) {
    var even_row = false;
    var replaced = null;
    if (typeof(row) == 'string') row = '#' + row; 
    row = $(row);
    if (row.hasClass('even-record')) even_row = true;

    replaced = this.replace(row, html);
    if (even_row === true) replaced.addClass('even-record');
    ActiveScaffold.highlight(replaced);
  },
  
  replace: function(element, html) {
    if (typeof(element) == 'string') element = '#' + element; 
    element = $(element);
    element.replaceWith(html);
    if (element.attr('id')) {
      element = $('#' + element.attr('id'));
    }
    return element;
  },
  
  replace_html: function(element, html) {
    if (typeof(element) == 'string') element = '#' + element; 
    element = $(element);
    element.html(html);
    return element;
  },
  
  remove: function(element) {
    if (typeof(element) == 'string') element = '#' + element; 
    $(element).remove();
  },
  
  hide: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    $(element).hide();
  },
  
  show: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    $(element).show();
  },
  
  reset_form: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    $(element).get(0).reset();
  },
  
  disable_form: function(as_form) {
    if (typeof(as_form) == 'string') as_form = '#' + as_form;
    as_form = $(as_form)
    var loading_indicator = $('#' + as_form.attr('id').replace(/-form$/, '-loading-indicator'));
    if (loading_indicator) loading_indicator.css('visibility','visible');
    $('input[type=submit]', as_form).attr('disabled', 'disabled');
    $("input:enabled,select:enabled", as_form).attr('disabled', 'disabled');
  },
  
  enable_form: function(as_form) {
    if (typeof(as_form) == 'string') as_form = '#' + as_form;
    as_form = $(as_form)
    var loading_indicator = $('#' + as_form.attr('id').replace(/-form$/, '-loading-indicator'));
    if (loading_indicator) loading_indicator.css('visibility','hidden');
    $('input[type=submit]', as_form).attr('disabled', '');
    $("input:disabled,select:disabled", as_form).attr('disabled', '');
  },  
  
  focus_first_element_of_form: function(form_element) {
    if (typeof(form_element) == 'string') form_element = '#' + form_element;
    $(form_element + ":first *:input[type!=hidden]:first").focus();
  },
    
  create_record_row: function(tbody, html) {
    if (typeof(tbody) == 'string') tbody = '#' + tbody;
    tbody = $(tbody);
    tbody.prepend(html);

    var new_row = tbody.children('tr:first-child');
    this.stripe(tbody);
    this.hide_empty_message(tbody);
    this.increment_record_count(tbody.closest('div.active-scaffold'));
    ActiveScaffold.highlight(new_row);
  },
  
  delete_record_row: function(row, page_reload_url) {
    if (typeof(row) == 'string') row = '#' + row;
    row = $(row);
    var tbody = row.closest('tbody.records');
    
    var current_action_node = row.find('td.actions a.disabled').first();
    if (current_action_node) {
      var action_link = ActiveScaffold.ActionLink.get(current_action_node);
      if (action_link) {
        action_link.close_previous_adapter();
      }
    }
    
    row.remove();
    this.stripe(tbody);
    this.decrement_record_count(tbody.closest('div.active-scaffold'));
    this.reload_if_empty(tbody, page_reload_url);
  },

  report_500_response: function(active_scaffold_id) {
    server_error = $(active_scaffold_id).find('td.messages-container p.server-error');
    if (!$(server_error).is(':visible')) {
      server_error.show();
    }
  },
  
  find_action_link: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    var as_adapter = $(element).closest('.as_adapter');
    return ActiveScaffold.ActionLink.get(as_adapter);;
  },
  
  scroll_to: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    var form_offset = $(element).offset(),
        destination = form_offset.top;
    $(document).scrollTop(destination);    
  },
  
  process_checkbox_inplace_edit: function(checkbox, options) {
    var checked = checkbox.is(':checked');
    if (checked === true) options['params'] += '&value=1';
    $.ajax({
      url: options.url,
      type: "POST",
      data: options['params'],
      dataType: options.ajax_data_type,
      after: function(request){
        checkbox.attr('disabled', 'disabled');
      },
      complete: function(request){
        checkbox.attr('disabled', '');
      }
    });
  },
  
  read_inplace_edit_heading_attributes: function(column_heading, options) {
    if (column_heading.attr('data-ie_cancel_text')) options.cancel_button = '<button class="inplace_cancel">' + column_heading.attr('data-ie_cancel_text') + "</button>";
    if (column_heading.attr('data-ie_loading_text')) options.loading_text = column_heading.attr('data-ie_loading_text');
    if (column_heading.attr('data-ie_saving_text')) options.saving_text = column_heading.attr('data-ie_saving_text');
    if (column_heading.attr('data-ie_save_text')) options.save_button = '<button class="inplace_save">' + column_heading.attr('data-ie_save_text') + "</button>";
    if (column_heading.attr('data-ie_rows')) options.textarea_rows = column_heading.attr('data-ie_rows');
    if (column_heading.attr('data-ie_cols')) options.textarea_cols = column_heading.attr('data-ie_cols');
    if (column_heading.attr('data-ie_size')) options.text_size = column_heading.attr('data-ie_size');
  }, 
  
  create_inplace_editor: function(span, options) {
    span.removeClass('hover');
    span.editInPlace(options);
    span.trigger('click.editInPlace');
  },
  
  highlight: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    if (typeof(element.effect) == 'function') {
      element.effect("highlight", {}, 3000);
    }
  },
  
  create_visibility_toggle: function(element, options) {
    if (typeof(element) == 'string') element = '#' + element;
    var toggable = $(element);
    var toggler = toggable.prev();
    var initial_label = (options.default_visible === true) ? options.hide_label : options.show_label;
    
    toggler.append(' (<a class="visibility-toggle" href="#">' + initial_label + '</a>)');
    toggler.children('a').click(function() {
      toggable.toggle(); 
      $(this).html((toggable.is(':hidden')) ? options.show_label : options.hide_label);
    });
  },
  
  create_associated_record_form: function(element, content, options) {
    if (typeof(element) == 'string') element = '#' + element;
    var element = $(element);
    if (options.singular == false) {
      if (!(options.id && $(options.id))) {
        element.append(content);
      }
    } else {
      if (current = $('#' + element.attr('id') + '.association-record')[0]) {
        this.replace(current, content);
      } else {
        element.prepend(content);
      }
    }
  },
  
  render_form_field: function(element, content, options) {
    if (typeof(element) == 'string') element = '#' + element;
    var element = $(element);
    if (options.is_subform == false) {
      this.replace(element.closest('dl'), content);
    } else {
      this.replace_html(element, content);
    }
  }
}

/*
 * DHTML history tie-in
 */
function addActiveScaffoldPageToHistory(url, active_scaffold_id) {
  if (typeof dhtmlHistory == 'undefined') return; // it may not be loaded

  var array = url.split('?');
  var qs = new Querystring(array[1]);
  var sort = qs.get('sort')
  var dir = qs.get('sort_direction')
  var page = qs.get('page')
  if (sort || dir || page) dhtmlHistory.add(active_scaffold_id+":"+page+":"+sort+":"+dir, url);
}

/*
 * URL modification support. Incomplete functionality.
 */
String.prototype.append_params = function(params) {
  var url = this;
  if (url.indexOf('?') == -1) url += '?';
  else if (url.lastIndexOf('&') != url.length) url += '&';

  for(var key in params) {
    if (key) url += (key + '=' + params[key] + '&');
  }
  
  // the loop leaves a comma dangling at the end of string, chop it off 
  url = url.substring(0, url.length-1);
  return url;
};


/**
 * A set of links. As a set, they can be controlled such that only one is "open" at a time, etc.
 */
ActiveScaffold.Actions = new Object();
ActiveScaffold.Actions.Abstract = Class.extend({
  init: function(links, target, loading_indicator, options) {
    this.target = $(target);
    this.loading_indicator = $(loading_indicator);
    this.options = options;
    var _this = this; 
    this.links = $.map(links, function(link) {
      var my_link = _this.instantiate_link(link);
      return my_link;
    });
  },

  instantiate_link: function(link) {
    throw 'unimplemented'
  }
});

/**
 * A DataStructures::ActionLink, represented in JavaScript.
 * Concerned with AJAX-enabling a link and adapting the result for insertion into the table.
 */
ActiveScaffold.ActionLink = {
  get: function(element) {
    if (typeof(element) == 'string') element = '#' + element;
    var element = $(element);
    element.data(); // jquery 1.4.2 workaround
    if (typeof(element.data('action_link')) === 'undefined' && !element.hasClass('as_adapter')) {
      var parent = element.parent();
      
      if (parent && parent.is('td')) {
        // record action
        parent = parent.closest('tr.record');
        var target = parent.find('a.as_action');
        var loading_indicator = parent.find('td.actions .loading-indicator');
        new ActiveScaffold.Actions.Record(target, parent, loading_indicator);
      } else if (parent && parent.is('div')) {
        //table action
        new ActiveScaffold.Actions.Table(parent.find('a.as_action'), parent.closest('div.active-scaffold').find('tbody.before-header'), parent.find('.loading-indicator'));
      }
      element = $(element);
    }
    return element.data('action_link');
  }
};
ActiveScaffold.ActionLink.Abstract = Class.extend({
  init: function(a, target, loading_indicator) {
    this.tag = $(a);
    this.url = this.tag.attr('href');
    this.method = 'get';
    
    if(this.url.match('_method=delete')){
      this.method = 'delete';
      // action delete is special case cause in ajax world it will be destroy
    } else if(this.url.match('/delete')){
      this.url = this.url.replace('/delete', '');
      this.tag.attr('href', this.url);
      this.method = 'delete';
    } else if(this.url.match('_method=post')){
      this.method = 'post';
    } else if(this.url.match('_method=put')){
      this.method = 'put';
    }
    if (this.method != 'get') this.tag.attr('data-method', this.method);
    this.target = target;
    this.loading_indicator = loading_indicator;
    this.hide_target = false;
    this.position = this.tag.attr('data-position');
		
    this.tag.data('action_link', this);
    return this;
  },

  open: function(event) {
  },
  
  insert: function(content) {
    throw 'unimplemented'
  },

  close: function() {
    this.enable();
    this.adapter.remove();
    if (this.hide_target) this.target.show();
  },

  reload: function() {
    this.close();
    this.open();
  },

  get_new_adapter_id: function() {
    var id = 'adapter_';
    var i = 0;
    while ($(id + i)) i++;
    return id + i;
  },

  enable: function() {
    return this.tag.removeClass('disabled');
  },

  disable: function() {
    return this.tag.addClass('disabled');
  },

  is_disabled: function() {
    return this.tag.hasClass('disabled');
  },

  scaffold_id: function() {
    return '#' + this.tag.closest('div.active-scaffold').attr('id');
  },
  
  update_flash_messages: function(messages) {
    message_node = $(this.scaffold_id().replace(/-active-scaffold/, '-messages'));
    if (message_node) message_node.html(messages);
  },
  set_adapter: function(element) {
    this.adapter = element;
    this.adapter.addClass('as_adapter');
    this.adapter.data('action_link', this);
  },
});

/**
 * Concrete classes for record actions
 */
ActiveScaffold.Actions.Record = ActiveScaffold.Actions.Abstract.extend({
  instantiate_link: function(link) {
    var l = new ActiveScaffold.ActionLink.Record(link, this.target, this.loading_indicator);
    var refresh = this.target.attr('data-refresh');
    if (refresh) l.refresh_url = refresh;
    
    if ($(link).hasClass('delete')) {
      l.url = l.url.replace(/\/delete(\?.*)?$/, '$1');
      l.url = l.url.replace(/\/delete\/(.*)/, '/destroy/$1');
      l.tag.attr('href', l.url);
    }
    if (l.position) {
      l.url = l.url.append_params({adapter: '_list_inline_adapter'});
      l.tag.attr('href', l.url);
    }
    l.set = this;
    return l;
  }
});

ActiveScaffold.ActionLink.Record = ActiveScaffold.ActionLink.Abstract.extend({
  close_previous_adapter: function() {
    var _this = this;
    $.each(this.set.links, function(index, item) {
      if (item.url != _this.url && item.is_disabled() && item.adapter) {
        item.enable();
        item.adapter.remove();
      }
    });
  },

  insert: function(content) {
    this.close_previous_adapter();

    if (this.position == 'replace') {
      this.position = 'after';
      this.hide_target = true;
    }

    if (this.position == 'after') {
      this.target.after(content);
      this.set_adapter(this.target.next());
    }
    else if (this.position == 'before') {
      this.target.before(content);
      this.set_adapter(this.target.prev());
    }
    else {
      return false;
    }
    ActiveScaffold.highlight(this.adapter.find('td'));
  },

  close: function(refreshed_content) {
    if (refreshed_content) {
      ActiveScaffold.update_row(this.target, refreshed_content);
    }
    this._super();
  },

  enable: function() {
    var _this = this;
    $.each(this.set.links, function(index, item) {
      if (item.url != _this.url) return;
      item.tag.removeClass('disabled');
    });
  },

  disable: function() {
    var _this = this;
    $.each(this.set.links, function(index, item) {
      if (item.url != _this.url) return;
      item.tag.addClass('disabled');
    });
  },
  
  set_opened: function() {
    if (this.position == 'after') {
      this.set_adapter(this.target.next());
    }
    else if (this.position == 'before') {
      this.set_adapter(this.target.prev());
    }
    this.disable();
  }
});

/**
 * Concrete classes for table actions
 */
ActiveScaffold.Actions.Table = ActiveScaffold.Actions.Abstract.extend({
  instantiate_link: function(link) {
    var l = new ActiveScaffold.ActionLink.Table(link, this.target, this.loading_indicator);
    if (l.position) {
      l.url = l.url.append_params({adapter: '_list_inline_adapter'});
      l.tag.attr('href', l.url);
    }
    return l;
  }
});

ActiveScaffold.ActionLink.Table = ActiveScaffold.ActionLink.Abstract.extend({
  insert: function(content) {
    if (this.position == 'top') {
      this.target.prepend(content);
      this.set_adapter(this.target.children().first());
    }
    else {
      throw 'Unknown position "' + this.position + '"'
    }
    ActiveScaffold.highlight(this.adapter.find('td').first().children());
  }
});
