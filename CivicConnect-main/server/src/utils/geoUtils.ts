import { HttpError } from "../middleware/errorHandler";

export const createGeoPoint = (longitude: number, latitude: number) => {
  if (
    Number.isNaN(longitude) ||
    Number.isNaN(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new HttpError(400, "Invalid longitude or latitude supplied");
  }

  return {
    type: "Point" as const,
    coordinates: [longitude, latitude],
  };
};

export const parseNearbyQuery = (longitude?: string, latitude?: string, radiusKm?: string) => {
  const lng = Number(longitude);
  const lat = Number(latitude);
  const radius = Number(radiusKm || 2);

  if (Number.isNaN(lng) || Number.isNaN(lat) || Number.isNaN(radius) || radius <= 0) {
    throw new HttpError(400, "longitude, latitude, and radiusKm must be valid numbers");
  }

  return {
    lng,
    lat,
    radiusMeters: radius * 1000,
  };
};

