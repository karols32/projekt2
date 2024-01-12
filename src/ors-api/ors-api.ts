import { IIsochronesOptions } from "./IIsochronesOptions";
import config from "./config";

export class OrsApi {
  constructor() {}

  async reverseGeocode(point: L.LatLng): Promise<string> {
    const { apiKey, reverseGeocodeUrl } = config;

    const url: string = `${reverseGeocodeUrl}api_key=${apiKey}&point.lon=${point.lng}&point.lat=${point.lat}`;
    const json = await fetch(url).then((r) => r.json());

    return json.features[0].properties.label;
  }

  async route(
    startPoint: L.LatLng,
    endPoint: L.LatLng,
    profile: string = "driving-car"
  ): Promise<object> {
    const { apiKey, routeServiceUrl } = config;

    const startCoords: string = `${startPoint.lng},${startPoint.lat}`;
    const endCoords: string = `${endPoint.lng},${endPoint.lat}`;

    const url: string = `${routeServiceUrl}${profile}?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;

    const json = await fetch(url).then((r) => r.json());

    return json;
  }

  async geocode(searchTerm: string): Promise<string[]> {
    const { apiKey, geocodeServiceUrl } = config;
    const apiUrl = `${geocodeServiceUrl}api_key=${apiKey}&text=${searchTerm}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      return data.features
    } catch (error) {
      console.error("Error fetching geocoding suggestions:", error);
      return [];
    }

    return [];
  }

  async addIsochrones(url: string, isochroneOptions: IIsochronesOptions) {

    const { interval, location, range, renderingType} = isochroneOptions;

    const startCoords: string = `${location.lng},${location.lat}`;
    const { apiKey } = config;

    const options: RequestInit = {
      method: "POST", 
      mode: "cors", 
      cache: "no-cache", 
      credentials: "same-origin", 
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        "Content-Type": "application/json",
        "Authorization": `${apiKey}`
      },
      redirect: "follow", 
      referrerPolicy: "no-referrer",
      body: `{"locations":[[${startCoords}]],"range":[${range}],"interval":${interval},"range_type":"${renderingType}"}`,
    }
    const response = await fetch(url, options);
    
    return response.json();
  }
}
