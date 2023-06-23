
function initNotification() {
Notification.requestPermission().then(perm => {
    //  if (perm === 'granted' || perm === 'default') {
        new Notification('Early transfert ')
    //  }
})
}