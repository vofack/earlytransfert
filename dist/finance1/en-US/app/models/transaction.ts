export interface Transaction {
    id : string,
    userEmail : string, // email of the user (owner of the account)
    transactionCode : string,
    sendingCountry : string,
    receivingCountry : string,
    receivingMethod : string,
    receiverNumber : string,
    senderNumber : string,
    receiver : string,
    amountSend : string,
    amountReceive : string,
    date : string,
    status : string,
    isPostWoner : boolean,
    isMarketPlace : boolean,
    expires_at : string
}

export interface allTransaction {
    id : string,
    userEmail : string, // email of the user (owner of the account)
    transactionCode : string,
    sendingCountry : string,
    receivingCountry : string,
    receivingMethod : string,
    receiverNumber : string,
    senderNumber : string,
    receiver : string,
    amountSend : string,
    amountReceive : string,
    date : string,
    status : string,
    isPostWoner : boolean,
    isMarketPlace : boolean,
    expires_at : string
}
