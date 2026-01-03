export interface EcontOffice {
  id: string;
  name: string;
  address: string;
  workingHours: string;
  city: string;
}

export interface EcontOfficesData {
  lastUpdated: string;
  totalCities: number;
  totalOffices: number;
  cities: string[];
  officesByCity: Record<string, EcontOffice[]>;
}






