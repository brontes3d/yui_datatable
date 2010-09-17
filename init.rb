$:.unshift "#{File.dirname(__FILE__)}/lib"
require 'yui_datatable'

if defined?(FieldDefs)
  FieldDefs.global_defaults do
      default_for_arg_type(:order_sql) do |field_defs|
        "#{field_defs.for_model.table_name}.#{field_defs.field_name.to_s}"
      end
  end

  FieldDefs.global_defaults do
      default_for_arg_type(:yui_formatter) do |field_defs|
        false
      end
  end

  FieldDefs.global_defaults do
      default_for_arg_type(:yui_parser) do |field_defs|
        false
      end
  end
  
  
end
