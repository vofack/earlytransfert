export interface Transaction {
    id : string,
    userEmail : string, // email of the user (owner of the account)
    transactionCode : string,
    receiver : string,
    amountSend : string,
    amountReceive : string,
    date : string,
    status : string
}
