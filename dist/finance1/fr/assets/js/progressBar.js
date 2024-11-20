function initProgressBar() {

    var p_bar=document.querySelectorAll(".progress_bar li");
    var p_bar_before=document.querySelectorAll(".progress_bar li::before");
    var p_bar_after=document.querySelectorAll(".progress_bar li::after");


    p_bar.forEach((all_list)=>{
        all_list.onclick=function(event){
            if(all_list.classList.contains('active')){
                all_list.classList.remove('active'); 
            }
            else{
                all_list.classList.add('active'); 
            } 
        }  
    });
}