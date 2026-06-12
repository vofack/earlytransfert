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
    expires_at : string,
    // Marketplace back-references (present only when isMarketPlace is true and
    // the transaction was spawned from a Post + Proposition acceptance).
    postId? : string,
    propositionId? : string,
    counterpartyEmail? : string
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
    expires_at : string,
    postId? : string,
    propositionId? : string,
    counterpartyEmail? : string,
    // Real creation time (HH:mm) and per-step timestamps shown on the mobile
    // tracking timeline. Optional: legacy docs may not carry them.
    time? : string,
    rate? : string,
    stageTimestamps? : { [status: string]: string }
}
