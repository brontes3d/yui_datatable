require 'rubygems'
gem 'test-unit'
require 'test/unit'

#set rails env CONSTANT (we are not actually loading rails in this test, but activerecord depends on this constant)
RAILS_ENV = 'test' unless defined?(RAILS_ENV)

require 'rubygems'

require 'activerecord'
require 'action_controller'
require 'action_controller/test_case'
require 'action_controller/test_process'

ActionController::Routing::Routes.clear!
ActionController::Routing::Routes.draw { |m| m.connect ':controller/:action/:id' }

#require field_defs plugin
require File.expand_path(File.dirname(__FILE__) + '/../../field_defs/init')
#require view_proc_field_def plugin
require File.expand_path(File.dirname(__FILE__) + '/../../view_proc_field_def/init')

require "#{File.dirname(__FILE__)}/../init"

ActiveRecord::Base.establish_connection(:adapter => "sqlite3", :database => ":memory:")

#load the database schema for this test
load File.expand_path(File.dirname(__FILE__) + "/mocks/schema.rb")

#require the mock models, controllers, datatables for this test    
require File.expand_path(File.dirname(__FILE__) + '/mocks/toadstool.rb')


class IntegrateViewProcTest < ActionController::TestCase
  # Replace this with your real tests.
  
  def setup
    @request    = ActionController::TestRequest.new
    @response   = ActionController::TestResponse.new
    
    ToadStool.create(:name => "Toad", :height => 10, :addiction => "Turnips", :legs => 1)

    @controller = ToadStoolsController.new
    @datatable = ToadStoolDataTable.new(@controller)
  end
  
  def teardown
    ToadStool.destroy_all
  end

  def test_display_procs_vs_view_procs 
    from_toadstools = ToadStool.find(:all)

    # puts from_toadstools.inspect
    
    get :index
    response_hash = ActiveSupport::JSON.decode(@response.body)
    
    # puts "response_hash: " + response_hash.inspect
    
    assert response_hash.is_a?(Hash), 
        "expecting make_response_hash to return a hash, but got: #{response_hash}"
  
    assert response_hash['records'].is_a?(Array), 
        "expecting make_response_hash ['records'] to be an array, but got: #{response_hash['records']}"
    
    assert_equal("Toad", response_hash['records'][0]['name'])
    assert_equal("Lot'o legs: 1", response_hash['records'][0]['legs'])
    assert_equal("<a href=\"/toad_stools/throw\">Turnips</a>", response_hash['records'][0]['addiction'])
  end
  
end
