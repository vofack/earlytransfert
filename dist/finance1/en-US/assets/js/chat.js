

function initChatBox() {

    // MESSAGE INPUT
const textarea = document.querySelector('.chatbox-message-input')
const chatboxForm = document.querySelector('.chatbox-message-form')

textarea.addEventListener('input', function () {
    let line = textarea.value.split('\n').length

    if(textarea.rows < 6 || line < 6) {
        textarea.rows = line
    }

    if(textarea.rows > 1) {
        chatboxForm.style.alignItems = 'flex-end'
    } else {
        chatboxForm.style.alignItems = 'center'
    }
})



// TOGGLE CHATBOX
const chatboxToggle = document.querySelector('.chatbox-toggle')
const chatboxMessage = document.querySelector('.chatbox-message-wrapper')


chatboxToggle.addEventListener('click', function () {
    chatboxMessage.classList.toggle('show')
})



// DROPDOWN TOGGLE
const dropdownToggle = document.querySelector('.chatbox-message-dropdown-toggle')
const dropdownMenu = document.querySelector('.chatbox-message-dropdown-menu')


dropdownToggle.addEventListener('click', function () {
    dropdownMenu.classList.toggle('show')
})

document.addEventListener('click', function (e) {
    if(!e.target.matches('.chatbox-message-dropdown, .chatbox-message-dropdown *')) {
        dropdownMenu.classList.remove('show')
    }
})


// CHATBOX MESSAGE
const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
const chatboxNoMessage = document.querySelector('.chatbox-message-no-message')

chatboxForm.addEventListener('submit', function (e) {
    e.preventDefault()
    const textarea = document.querySelector('.chatbox-message-input')
    if(isValid(textarea.value)) {
        writeMessage()
        setTimeout(autoReply, 1000)
    }
})

document.getElementById("submit").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        const textarea = document.querySelector('.chatbox-message-input')
        if(isValid(textarea.value)) {
            writeMessage()
            setTimeout(autoReply, 1000)
        }
    }
})



}

function addZero(num) {
return num < 10 ? '0'+num : num
}

function writeMessage() {
const today = new Date()
const textarea = document.querySelector('.chatbox-message-input')
const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
const chatboxNoMessage = document.querySelector('.chatbox-message-no-message')
const chatboxForm = document.querySelector('.chatbox-message-form')
let message = `
<div class="chatbox-message-item sent">
    <span class="chatbox-message-item-text">
        ${textarea.value.trim().replace(/\n/g, '<br>\n')}
    </span>
    <span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
</div>
`
chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
chatboxForm.style.alignItems = 'center'
textarea.rows = 1
textarea.focus()
textarea.value = ''
chatboxNoMessage.style.display = 'none'
scrollBottom()
}

function autoReply() {
const today = new Date()
const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
let message = `
<div class="chatbox-message-item received">
    <span class="chatbox-message-item-text">
        Thank you for your awesome support!
    </span>
    <span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
</div>
`
chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
scrollBottom()
}

async function autoReply_() {
const today = new Date()
const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
const textarea = document.querySelector('.chatbox-message-input')

var res = "";
await axios.get(`https://api.monkedev.com/fun/chat?msg=${textarea}`).then(data => {
res = JSON.stringify(data.data.response)
})

let message = `
<div class="chatbox-message-item received">
    <span class="chatbox-message-item-text">` + 
     res
     `</span>
    <span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
</div>
`
chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
scrollBottom()
}

function scrollBottom() {
const chatboxMessageWrapper = document.querySelector('.chatbox-message-content')
chatboxMessageWrapper.scrollTo(0, chatboxMessageWrapper.scrollHeight)
}

function isValid(value) {
let text = value.replace(/\n/g, '')
text = text.replace(/\s/g, '')

return text.length > 0
}
