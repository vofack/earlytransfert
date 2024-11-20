import { type } from "os";
declare let emailjs: any;

addEventListener('message', ({ data }) => {
    //emailjs.init("tUQeOzkPpQAFgk7bb");
alert(data)
    const response = 'worker response to ${data}';
    postMessage(response);
})