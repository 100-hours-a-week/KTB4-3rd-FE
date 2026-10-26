export { registerOwnedCar, type OwnedCarRegistrationResponse } from './api/register-owned-car';
export { deleteOwnedCar } from './api/delete-owned-car';
export { getOwnedCars, type OwnedCarListResponse } from './api/get-owned-cars';
export { updateOwnedCar, type OwnedCarUpdateResponse } from './api/update-owned-car';
export type {
  OwnedCar,
  OwnedCarListData,
  OwnedCarRegistrationData,
  OwnedCarRegistrationPayload,
  OwnedCarUpdateData,
} from './model/owned-car';
