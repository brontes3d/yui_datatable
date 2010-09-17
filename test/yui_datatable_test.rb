require 'rubygems'
gem 'test-unit'
require 'test/unit'
# puts "gems required"
# require 'test/unit/notification'
# require 'test/unit/testresult'
# Test::Unit::TestResult::TestResultFailureSupport = Test::Unit::TestResultFailureSupport
# require 'test/unit/failure'

# require 'test/unit/testresult'
# puts "test/unit/notification required"
# require 'test/unit'
# puts "test/unit required"

# puts "loaded..."

#set rails env CONSTANT (we are not actually loading rails in this test, but activerecord depends on this constant)
RAILS_ENV = 'test' unless defined?(RAILS_ENV)

require 'activerecord'
require 'action_controller'
require 'action_controller/test_case'
require 'action_controller/test_process'

ActionController::Routing::Routes.clear!
ActionController::Routing::Routes.draw { |m| m.connect ':controller/:action/:id' }

#require field_defs plugin
require File.expand_path(File.dirname(__FILE__) + '/../../field_defs/init')

require "#{File.dirname(__FILE__)}/../init"

ActiveRecord::Base.establish_connection(:adapter => "sqlite3", :database => ":memory:")

#load the database schema for this test
load File.expand_path(File.dirname(__FILE__) + "/mocks/schema.rb")

#require the mock models, controllers, datatables for this test    
require File.expand_path(File.dirname(__FILE__) + '/mocks/data_tables.rb')


class YuiDatatableTest < ActionController::TestCase
  # Replace this with your real tests.
  
  def setup
    @request    = ActionController::TestRequest.new
    @response   = ActionController::TestResponse.new
    
    Brawler.create(:name => "Mario",
                   :smash_power => 10,
                   :damage_taken => 0,
                   :stock => 3)

    Brawler.create(:name => "Pikachu",
                  :smash_power => 20,
                  :damage_taken => 50,
                  :stock => 1)

    Brawler.create(:name => "Kirby",
                  :smash_power => 5,
                  :damage_taken => nil,
                  :stock => 0)

    @controller = BrawlersController.new
    @datatable = BrawlersDataTable.new(@controller)
  end
  
  def teardown
    Brawler.destroy_all
  end
  
  def test_brawlers_controller
    response_checker = Proc.new do |brawlers_that_should_have_been_returned, from_params, explanation|
      expected = @datatable.make_response_hash(
                      brawlers_that_should_have_been_returned,
                      @datatable.make_response_hash_options(from_params))
      expected_json_tansformed = ActiveSupport::JSON.decode(expected.to_json)

      assert_equal(expected_json_tansformed, ActiveSupport::JSON.decode(@response.body), explanation)
    end
    
    #normal get
    get :index
    response_checker.call(Brawler.find(:all, @datatable.query_options), {},
      "Index action should return all brawlers, contrained by the specified query_options")
    
    #search
    get :index, :search => "Mario"
    response_checker.call([Brawler.find_by_name("Mario")], {:search => "Mario"},
      "Search for Mario should return only 1 record and that record should be Mario")
    
    #pagination
    get :index, :offset => 1
    response_checker.call(Brawler.find(:all, @datatable.query_options.merge(:offset => 1)), {:offset => 1},
      "get with offset 1 should return same thing as search with offset 1")

    #sort
    get :index, :order_key=>'name', :order_dir=>'asc'    
    response_checker.call(Brawler.find(:all, @datatable.query_options.merge(:order=>'name asc')), {:order_key=>'name', :order_dir=>'asc'},
      "get with :order_key=>'name', :order_dir=>'asc' should return same records as find with :order=>'name asc'")    
  end
  
  #test make_response_hash
  def test_make_response_hash        
    test_response_hash = Proc.new do |from_brawlers|    
      response_hash = @datatable.make_response_hash(from_brawlers)
    
      assert response_hash.is_a?(Hash), 
          "expecting make_response_hash to return a hash, but got: #{response_hash}"
    
      assert response_hash[:records].is_a?(Array), 
          "expecting make_response_hash [:records] to be an array, but got: #{response_hash[:records]}"
      
      if(from_brawlers[0])
        assert_equal(from_brawlers[0].name, response_hash[:records][0][:name])
      end

      assert_equal(from_brawlers.size, response_hash[:records].size)

      assert_equal(from_brawlers.size, response_hash[:records_returned])

      assert_equal(from_brawlers.size, response_hash[:total_records])

      assert_equal(0, response_hash[:offset])
    end
    
    test_response_hash.call(Brawler.find(:all))
    
    test_response_hash.call([Brawler.find(:first)])
    
    test_response_hash.call([])
  end
  
  #test response_schema
  def test_response_schema
    expected = {:resultsList=>"records", 
                :metaFields=>{:sortKey=>"order_key", 
                              :paginationRowsPerPage=>"page_size",
                              :sortDir=>"order_dir", 
                              :totalRecords=>"total_records", 
                              :paginationRecordOffset=>"offset"}, 
                :fields=>[{:key=>"url"}, 
                          {:key=>"name"}, 
                          {:key=>"smash_power"}, 
                          {:key=>"damage_taken"}]}
    
    assert_equal(expected, @datatable.response_schema)
  end
  
  #test column_defs
  def test_column_defs
    expected = [{:label=>"Name", :sortable=>true, :formatter=>"CustomFormatterThing", :key=>"name"}, 
                {:label=>"Smash power", :sortable=>true, :key=>"smash_power"}, 
                {:label=>"Damage taken", :sortable=>true, :key=>"damage_taken"}]
    
    assert_equal(expected, @datatable.column_defs)
  end

  #test make_response_hash_options
  def test_make_response_hash_options
    #normal
    expected = {:total_records=>2, :order_key=>nil, :order_dir=>nil, :offset=>0, :page_size=>0}
    assert_equal(expected, @datatable.make_response_hash_options({}))
    
    #search
    expected = {:order_key=>nil, :order_dir=>nil}
    assert_equal(expected, @datatable.make_response_hash_options({:search => "Mario"}))

    #pagination
    expected = {:total_records=>2, :order_key=>nil, :order_dir=>nil, :offset=>1, :page_size=>0}
    assert_equal(expected, @datatable.make_response_hash_options({:offset => 1}))
    
    #sort
    expected = {:total_records=>2, :order_key=>"name", :order_dir=>"asc", :offset=>0, :page_size=>0}
    assert_equal(expected, @datatable.make_response_hash_options({:order_key=>'name', :order_dir=>'asc'}))
  end
  
  #test respond_to_query
  def test_query_options
    assert_equal({:conditions => ["brawlers.stock > 0"]}, @datatable.query_options)
  end
  
end
