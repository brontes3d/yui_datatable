class Brawler < ActiveRecord::Base
  
  def self.field_defs
    @@field_definitions ||= FieldDefs.new(Brawler) do    
      field(:name)
      field(:smash_power)
      field(:damage_taken)
    end
  end
  
  #our basic implementation of search only looks by name
  def self.search(search_string, active_record_find_options)
    self.find_all_by_name(search_string, active_record_find_options)
  end
  
end

class BrawlersDataTable < YuiDatatable
  
  #Brawler is the model class that objects in this data table are assumed to is_a
  model Brawler
  
  #Use Brawler.field_defs as the definition of fields on Braweler and how to handle them
  field_defs Brawler.field_defs

  #When fetching brawlers to populate the data table, apply these additinal conditions to the search (on top of conditions specified in params)
  extra_query_options :conditions => ["brawlers.stock > 0"]
  
  #Define the data columns to show for this data table (order matters)
    
                                     #custom logic for displaying this field requires access to something on the controller
                                     #A better implementation of display_proc would be: 
                                     #    => Proc.new{ |controller, brawler| controller.send(:brawler_url, brawler) }
                                     #but for testing purposes, this is just easier than setting up the controller for every test
    data_column :url, :hide => true, :display_proc => Proc.new{ |controller, brawler| "/brawler/#{brawler.id}" }
                      #hide means don't incldue this field in column defs
                      
                                      #formatter is an additional option to pass to YUI in column defs  
    data_column :name, :formatter => "CustomFormatterThing"
    
    #last arg is checked to see if it's a hash to determine options that affect the whole line.  Rest of args are assumed to be fields
    data_column :smash_power, :damage_taken
    
end

class BrawlersController < ActionController::Base
  
  def index
    # puts "index action with params: " + params.inspect
    @data_table = BrawlersDataTable.new(self)
    render :json => @data_table.respond_to_query(params)
  end

  #re-raise errors up to the tests
  def rescue_action(e) raise e end
  
end