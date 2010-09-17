class ToadStool < ActiveRecord::Base
  
  def self.field_defs
    @@field_definitions ||= FieldDefs.new(ToadStool) do    
      field(:name)
      field(:height)
      field(:addiction) do
        display_proc do |addiction|
          "Addicted to #{addiction}"
        end
        view_proc_in_context do |toadstool|
          link_to(toadstool.addiction, url_for(:action => 'throw'))
        end
      end
      field(:legs) do
        display_proc do |legs|
          "Lot'o legs: #{legs}"
        end
      end
    end
  end
  
  #our basic implementation of search only looks by name
  def self.search(search_string, active_record_find_options)
    self.find_all_by_name(search_string, active_record_find_options)
  end
  
end

class ToadStoolDataTable < YuiDatatable
  
  #Brawler is the model class that objects in this data table are assumed to is_a
  model ToadStool
  
  #Use Brawler.field_defs as the definition of fields on Braweler and how to handle them
  field_defs ToadStool.field_defs

  data_column :name, :height, :addiction, :legs
    
end

class ToadStoolsController < ActionController::Base
  
  def index
    # puts "index action with params: " + params.inspect
    @data_table = ToadStoolDataTable.new(self)
    render :json => @data_table.respond_to_query(params)
  end

  #re-raise errors up to the tests
  def rescue_action(e) raise e end
  
end