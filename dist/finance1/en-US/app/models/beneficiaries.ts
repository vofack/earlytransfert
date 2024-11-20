import { Beneficiary } from "./beneficiary";

export interface Beneficiaries {
    id : string,
    userEmail : string, // id of the user
    beneficiary: [Beneficiary]
}
