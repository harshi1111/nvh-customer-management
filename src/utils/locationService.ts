// Location Service using CountriesNow API
// Free API: https://countriesnow.space/

const BASE_URL = 'https://countriesnow.space/api/v0.1';

interface ApiResponse<T> {
  error: boolean;
  msg: string;
  data: T;
}

export interface Country {
  country: string;
}

export interface State {
  name: string;
  state_code?: string;
}

export interface City {
  name: string;
}

class LocationService {
  // Cache for better performance
  private countriesCache: Country[] | null = null;
  private statesCache: Map<string, State[]> = new Map();
  private citiesCache: Map<string, City[]> = new Map();

  // Get all countries
  async getCountries(): Promise<Country[]> {
    if (this.countriesCache) {
      return this.countriesCache;
    }

    try {
      const response = await fetch(`${BASE_URL}/countries`);
      const data: ApiResponse<Country[]> = await response.json();
      
      if (data.error) {
        console.error('Error fetching countries:', data.msg);
        return [];
      }
      
      this.countriesCache = data.data || [];
      return this.countriesCache;
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  // Get states for a specific country
  async getStates(country: string): Promise<State[]> {
    const cacheKey = `states_${country}`;
    if (this.statesCache.has(cacheKey)) {
      return this.statesCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${BASE_URL}/countries/states`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country })
      });
      
      const data: ApiResponse<{ states: State[] }> = await response.json();
      
      if (data.error || !data.data.states) {
        console.error('Error fetching states:', data.msg);
        return [];
      }
      
      const states = data.data.states || [];
      this.statesCache.set(cacheKey, states);
      return states;
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  // Get cities for a specific country and state
  async getCities(country: string, state: string): Promise<City[]> {
    const cacheKey = `cities_${country}_${state}`;
    if (this.citiesCache.has(cacheKey)) {
      return this.citiesCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${BASE_URL}/countries/state/cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country, state })
      });
      
      const data: ApiResponse<City[]> = await response.json();
      
      if (data.error) {
        console.error('Error fetching cities:', data.msg);
        return [];
      }
      
      const cities = data.data || [];
      this.citiesCache.set(cacheKey, cities);
      return cities;
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  // Search countries by name
  async searchCountries(query: string): Promise<Country[]> {
    const countries = await this.getCountries();
    return countries.filter(country => 
      country.country.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Clear cache (useful for testing or when you want fresh data)
  clearCache(): void {
    this.countriesCache = null;
    this.statesCache.clear();
    this.citiesCache.clear();
  }
}

export default new LocationService();