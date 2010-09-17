ActiveRecord::Schema.define do

  create_table "brawlers", :force => true do |t|
    t.string   "name"
    t.integer  "smash_power"
    t.integer  "damage_taken"
    t.integer  "stock"
  end

  create_table "toad_stools", :force => true do |t|
    t.string   "name"
    t.integer  "height"
    t.string   "addiction"
    t.integer   "legs"
  end

end