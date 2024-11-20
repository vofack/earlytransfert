function initEmail( message ) {
 
    let email = message.split('*')[0];
      emailjs.init("tUQeOzkPpQAFgk7bb");
      var params = {
        name: message.split('*')[1],
        email: email,
        message: message,
      };
      const serviceID = "service_9tgpzgm";
      const templateID = "template_zeznrkh";


        emailjs.send(serviceID, templateID, params)
        .then(res=>{
   
            console.log("Your message sent successfully!!")

        })
        .catch(err=>console.log(err));
 
}