class YuiDatatable  
  
  def initialize(controller)
    @controller = controller
  end
  
  def self.field_defs(field_defs)
    self.class_eval do
      cattr_accessor :field_defs
    end
    self.field_defs ||= field_defs
  end
  
  def self.data_column(*args)
    self.class_eval do
      cattr_accessor :defined_data_columns
      cattr_accessor :currently_defining_grouping
    end
    self.defined_data_columns ||= ActiveSupport::OrderedHash.new
    options = (args.last.is_a?(Hash)) ? args.pop : {}
    args.each do |arg|
      set_to_field_def = self.field_defs.field_called(arg)
      opts = options.merge(:field_def => set_to_field_def)
      unless opts[:field_def] || opts[:display_proc]
        raise ArgumentError, "No field_def or display_proc found for field #{arg} in #{self.field_defs.for_model} on #{self} " + self.field_defs.all_attributes.inspect
      end
      if self.currently_defining_grouping
        opts[:grouping] = self.currently_defining_grouping
      end
      self.defined_data_columns[arg] = opts
    end
  end
  
  def self.grouping(options, &block)
    self.class_eval do
      cattr_accessor :defined_groupings
      cattr_accessor :currently_defining_grouping
    end
    self.defined_groupings ||= []
    self.defined_groupings << options
    self.currently_defining_grouping = options
    self.instance_eval(&block)
    self.currently_defining_grouping = nil
  end
  
  def self.model(model)
    self.class_eval do
      cattr_accessor :model
    end
    self.model = model
  end
  
  def self.view_option(called, &block)
    self.class_eval do
      cattr_accessor :view_options
    end
    self.view_options ||= {}
    self.view_options[called] = block
  end
  
  def get_view_option(called)
    unless self.class.respond_to?(:view_options) && self.class.view_options[called]
      raise ArgumentError, "No view options were defined as #{called}"
    end
    self.class.view_options[called].call(@controller)
  end
  
  def self.extra_query_options(opts)
    self.class_eval do
      cattr_accessor :query_options
    end
    self.query_options = opts
  end
    
  def extract_query_options(params)
    # Rails.logger.debug { "\nextract_query_options ..." }
    # Rails.logger.debug { "self.class = #{self.class.inspect}" }
    if self.class.respond_to? :query_options
      # Rails.logger.debug { "self.class.query_options = #{self.class.query_options.inspect}" }
      self.class.query_options.dup
    else
      {}
    end
  end
  
  def data_columns
    self.class.defined_data_columns
  end

  def make_response_hash(from_objects, json_hash_defaults = {}, alt_display_proc = nil)
    # RAILS_DEFAULT_LOGGER.debug("making response from: " + from_objects.inspect)
    # params = @controller.params
    # puts "making hash from: " + from_objects.inspect

    from_objects = [] if from_objects.nil?

    objects = []
    
    #Collect the display procs ahead of time to speed things up
    data_column_display_procs = {}
    # Rails.logger.debug("making data table with columns: " + self.data_columns.keys.inspect)
    self.data_columns.each do |key, column_opts|
      should_return_data = column_opts[:only_if].blank? ? true : column_opts[:only_if].call(@controller)
      # Rails.logger.debug("should_return_data = " + should_return_data.inspect)
      
      if should_return_data 
        standard_render = 
          if display_proc = column_opts[:display_proc]
            display_proc
          elsif field_def = column_opts[:field_def]
            if field_def.respond_to?(:view_proc)
              Proc.new{ |contrl, obj| field_def.view_proc.call(obj) }
            else
              dp = field_def.display_proc
              rp = field_def.reader_proc
              Proc.new{ |contrl, obj| dp.call(rp.call(obj)) }
            end
          else
            raise "no display_proc or field_def available for #{key}"
          end
        if alt_display_proc
          data_column_display_procs[key] = Proc.new do |controller, object| 
            alt_display_proc.call(key, column_opts, controller, object, standard_render)
          end
        else
          data_column_display_procs[key] = standard_render
        end
      end
    end
    
    objects = from_objects.collect do |obj|
      hash_of_it = {}
      
      #run through cached display procs
      data_column_display_procs.each do |key, dproc|
        hash_of_it[key] = dproc.call(@controller, obj)
      end
      
      #This version was much slower...
      # self.data_columns.each do |key, column_opts|
      #   if display_proc = column_opts[:display_proc]
      #     hash_of_it[key] = display_proc.call(@controller, obj)
      #   elsif field_def = column_opts[:field_def]
      #     # puts "calling display proc for #{key} on: " + obj.inspect
      #     hash_of_it[key] = field_def.display_proc.call(field_def.reader_proc.call(obj))
      #   else
      #     raise "no display_proc or field_def available for #{key}"
      #   end
      # end
      
      hash_of_it
    end
    
    { 
      :records_returned => objects.length, 
      :total_records => objects.length, 
      :records => objects, 
      :offset => 0 
    }.merge(json_hash_defaults)
  end
  
  def get_response_records(params)
    respond_to_query(params)[:records]
  end
  
  #Generate the "Schema" which will be converted to JSON and used by the YUI javascript so it known what to do with the "data" JSON
  #This is really a formatter for the schema information pulled from a call to self.data_columns
  def response_schema(additional_meta_fields = {})
    fields = Array.new    
    # Rails.logger.debug("before making response schema, data columns are: " + self.data_columns.size.inspect)
    # Rails.logger.debug("before making response schema, data columns are: " + self.data_columns.class.inspect)
    
    self.data_columns.each do |column_name, opts| 
      # Rails.logger.debug("data_column: " + column_name.inspect)
      column_response_schema = {:key => column_name.to_s}
      
      if opts.has_key?(:parser)
        column_response_schema[:parser] = opts[:parser]
      elsif column_opts = self.data_columns[column_name.to_sym]
        if field_def = column_opts[:field_def]
          if yui_parser = field_def.yui_parser
            column_response_schema[:parser] = yui_parser
          end
        end
      end
      
      # Rails.logger.debug("adding field: " + column_response_schema.inspect)      
      fields << column_response_schema
    end
    

    # Rails.logger.debug("returning response schema, fields are: " + fields.inspect)    
    { :resultsList => 'records', 
      :fields => fields,
      :metaFields => {
        :totalRecords => "total_records",
        :paginationRecordOffset => "offset",
        :paginationRowsPerPage => "page_size",
        :sortKey => "order_key",
        :sortDir => "order_dir"
      }.merge(additional_meta_fields)
    }
  end
  
  
  def self.extract_opts_for_column_defs(opts)
    to_return = {}
    [:formatter, :sortable, :sortOptions, :className].each do |key|
      to_return[key] = opts[key] if opts.has_key?(key)
    end
    to_return
  end
  
  def column_defs
    to_return = []
    self.data_columns.each do |key, column_opts|
      # Rails.logger.debug { "\nkey = #{key}\ncolumn_opts = #{column_opts.inspect}" }
      
      show_this_columns_data = column_opts[:only_if].blank? ? true : column_opts[:only_if].call(@controller)
      # Rails.logger.debug { "show_this_columns_data = #{show_this_columns_data.inspect}" }
      # Rails.logger.debug { "column_opts[:hide] = #{column_opts[:hide].inspect}" }
      
      unless column_opts[:hide] or !show_this_columns_data
        field_def = column_opts[:field_def]
        raise ArgumentError, ":field_def for #{key} must be provided in column_opts for #{self}" unless field_def
        
        hash_of_this_field = {
          :key => key.to_s, 
          :label => column_opts[:human_name] || field_def.human_name, 
          :sortable => true}
        
        if yui_formatter = field_def.yui_formatter
          hash_of_this_field[:formatter] = yui_formatter
        end
        
        hash_of_this_field = hash_of_this_field.merge(YuiDatatable.extract_opts_for_column_defs(column_opts))
        
        if column_opts[:grouping]
          unless to_return.last[:label] == column_opts[:grouping][:label] && 
                 to_return.last[:key] == column_opts[:grouping][:key]
            grouping_to_add = column_opts[:grouping].dup
            grouping_to_add[:children] = []
            to_return << grouping_to_add
          end
          to_return.last[:children] << hash_of_this_field
        else
          to_return << hash_of_this_field
        end
      end
    end
    to_return
  end
  
  def run_search(for_string, options)
    model.search(for_string, options)
  end
  
  def run_find(options)
    # Rails.logger.debug { "\nIn run_find with options: #{options.inspect}" }
    
    if self.class.respond_to?(:named_scope_proc) && named_scope_proc = self.class.named_scope_proc
      # Rails.logger.debug { "if self.class.respond_to?(:named_scope_proc) && named_scope_proc = self.class.named_scope_proc" }
      model.instance_eval do
        with_scope(options){
          named_scope_proc.call(self)
        }
      end
    else
      model.find(:all, options)
    end
  end
  
  def self.use_named_scope(scope_proc)
    self.class_eval do
      cattr_accessor :named_scope_proc
    end
    self.named_scope_proc = scope_proc
  end
  
  def respond_to_query(params, with_response_hash = true)
    # Rails.logger.debug { "\nIn respond_to_query with params: #{params.inspect}" }
    
    response_objects = []
    
    options_for_find = {}
    if params[:order_key]
      params[:order_dir] ||= "asc"  #FIXME: security hole putting params directly into SQL here
      if order_key_field = field_defs.field_called(params[:order_key])
        # field_def.order_sql
        options_for_find[:order] = "#{order_key_field.order_sql} #{params[:order_dir]}"
      else
        raise "can't order by #{params[:order_key]} because that field is not in field_defs"
      end
    end
    if params[:offset]
      options_for_find[:offset] = params[:offset].to_i
    end
    if params[:limit]
      options_for_find[:limit] = params[:limit].to_i
    end
        
    unless params[:search].blank?
      #limit, offset, and ordering params are ignored on search becasue these functions are performed client-side
      unless model.respond_to?(:search)
        raise ArgumentError, "In order to support search, you must implement the class method "+
                              "'search(search_string, active_record_find_options)' on #{model}"
      end
      response_objects = run_search(params[:search], options_for_find.merge(extract_query_options(params)))
    else
      # Rails.logger.debug { "Extract query options: #{extract_query_options(params).inspect}"}
      response_objects = run_find(options_for_find.merge(extract_query_options(params)))
    end
    
    if with_response_hash
      make_response_hash(response_objects, make_response_hash_options(params))
    else
      response_objects
    end
  end
  
  def make_response_hash_options(params)
    if params[:search].blank?
      {:total_records => model.count(extract_query_options(params).reject {|k, v| k == :select}), :offset => params[:offset].to_i, :page_size => params[:limit].to_i, :order_key => params[:order_key], :order_dir => params[:order_dir]}
    else
      {:order_key => params[:order_key], :order_dir => params[:order_dir]}
    end      
  end
  
  
end