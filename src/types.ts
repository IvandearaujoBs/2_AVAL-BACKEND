export type TripRequestStatus = "pending" | "canceled";

export interface TripRequest {
  id: string;
  requesterName: string;
  origin: string;
  destination: string;
  departureAt: string;
  returnAt: string;
  purpose: string;
  passengerCount: number;
  status: TripRequestStatus;
  createdAt: string;
}

export interface CreateTripRequestInput {
  requesterName: string;
  origin: string;
  destination: string;
  departureAt: string;
  returnAt: string;
  purpose: string;
  passengerCount: number;
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export interface TripRequestFilters {
  status?: TripRequestStatus;
  origin?: string;
  destination?: string;
  requesterName?: string;
  departureFrom?: string;
  departureTo?: string;
}
