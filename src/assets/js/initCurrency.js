function intCurrency() {

    const select = document.querySelectorAll('.currency');
    const select1 = document.getElementById('currency1');
    const select2 = document.getElementById('currency2');
    const button = document.getElementById('btn');
    const number_box = document.getElementById('number_box');
    const answer_box = document.getElementById('answer_box');

    fetch('https://api.frankfurter.app/currencies')
    .then((response) => response.json())
    .then((data) => {

        show(data);
    });

    function show(data){
        const asArray = Object.entries(data);

        for (let i=0; i<asArray.length; i++){

            var opt = document.createElement("option");
            opt.value= asArray[i][0];
            opt.innerHTML = asArray[i][1]; // whatever property it has
            // then append it to the select element
            select1.appendChild(opt);
            select2.appendChild(opt);
        }
    }

    button.addEventListener('click', () => {
        let currency_one = 'CAD';
        let currency_two = 'XAF';
        let value = number_box.value;

        if(currency_one != currency_two){ 
            convert();
        }else{
            alert('choose the currency');
        }
    });

     function   convert() {
            const base = 'CAD';
            fetch(`https://api.exchangerate.host/latest?/source=ecb&base=${base}`)
                .then((response) => response.json())
                .then((data) => {
                    const amount = '1000';
                    const currencyTo = 'XAF';
                    const rate = data.rates[currencyTo];
                    return amount * rate;
                })
            .catch((error) =>{
                console.log("Error: ", error);
            });
            return false;
        }

    
    
}