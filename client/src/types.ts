export interface Plant {
  id: string;
  class: string;
  species: string;
  variety: string;
  plant_name: string;
  location: string | null;
  unconfirmed: number;
  created_at: string;
  updated_at: string;
}

export interface PlantHistory {
  id: string;
  plant_id: string;
  date: string;
  event: string;
}

export interface PlantPhoto {
  id: string;
  plant_id: string;
  filename: string;
  uploaded_at: string;
}

export interface CarePlan {
  plant_id: string;
  text: string;
  weather_json: string | null;
  generated_at: string;
}

export interface BotanicalProfile {
  plant_id: string;
  text: string;
  generated_at: string;
}

export interface Harvest {
  id: string;
  plant_id: string;
  date: string;
  amount: string | null;
  notes: string | null;
}

export interface WishListItem {
  id: string;
  class: string | null;
  species: string | null;
  variety: string;
  reason: string | null;
  priority: 'high' | 'medium' | 'low' | null;
}

export interface Recipe {
  id: string;
  name: string;
  category: string | null;
  type: 'Baking' | 'Cooking' | null;
  emoji: string | null;
  ingredients: string | null;
  method: string | null;
  notes: string | null;
  source_url: string | null;
  created_at: string;
}

export interface MealPoolItem {
  id: string;
  name: string;
  components: string | null;
  time_estimate: string | null;
  season: string | null;
  added_at: string;
}

export interface MealRating {
  id: string;
  meal_name: string;
  rating: string;
  rated_at: string;
}

export interface GroceryItem {
  id: string;
  section: string;
  item: string;
  recipes: string | null;
  purchased: number;
}

export interface Project {
  id: string;
  title: string;
  status: 'active' | 'todo' | 'completed';
  owner: string | null;
  category: string | null;
  start_date: string | null;
  budget: number | null;
  next_action: string | null;
  hero_image: string | null;
  created_at: string;
}

export interface ProjectMaterial {
  id: string;
  project_id: string;
  name: string;
  cost: number | null;
  where_buy: string | null;
  bought: number;
  sort_order: number | null;
}

export interface ProjectLabor {
  id: string;
  project_id: string;
  description: string;
  cost: number | null;
  contractor: string | null;
  paid: number;
  sort_order: number | null;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  date: string;
  text: string;
}

export interface ProjectResource {
  id: string;
  project_id: string;
  label: string;
  url: string | null;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  category: string | null;
  frequency_days: number;
  notes: string | null;
  last_done_at: string | null;
  next_due_at: string | null;
}

export interface MaintenanceHistory {
  id: string;
  task_id: string;
  task_name: string;
  completed_at: string;
  who: string | null;
  notes: string | null;
}

export interface ShoppingItem {
  id: string;
  room: string;
  name: string;
  brand: string | null;
  price: number | null;
  qty: number;
  image_url: string | null;
  image_filename: string | null;
  notes: string | null;
  source_url: string | null;
  sort_order: number | null;
  created_at: string;
}

export interface WeatherDay {
  date: string;
  high: number;
  low: number;
  precip: number;
  code: number;
  icon: string;
}
