export type OwnedCarRegistrationPayload = {
  model: string;
  number: string;
};

export type OwnedCar = {
  id: number;
  model: string;
  number: string;
};

export type OwnedCarRegistrationData = {
  id: number;
  createdAt: string;
};

export type OwnedCarUpdateData = {
  updatedAt: string;
};

export type OwnedCarListData = {
  cars: OwnedCar[];
};
