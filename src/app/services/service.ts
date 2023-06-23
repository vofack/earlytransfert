import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Service {
  products: ProductResponseModel[] = [];
  ServerURL = environment.serverURL;

  constructor(private http: HttpClient) {
  }


  getSingleOrder(orderId: Number) {
    return this.http.get<ProductResponseModel[]>(`${this.ServerURL}orders/${orderId}`).toPromise();
  }

  getCurrency(currency: string): Observable < any > {
    let today = new Date();
   // let today_ = new Date().toLocaleString("en-US", {timeZone: "Africa/Ndjamena"})
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let today_ =  yyyy + '/' + mm  + '/' + dd;

    const url = this.ServerURL + currency + '&v=' + today_;
    return this.http.get<any>(url);
  }

  sendWhasap(number: string): Observable < any > {
    const url = 'https://betablaster.in/api/send.php?number=' + number +'&type=text&message=test%20message&instance_id=64674E4507E74&access_token=3ed83066f2f69f0c19f7f5d6ddd5065a';
    return this.http.get<any>(url);
  }
}

interface ProductResponseModel {
  id: Number;
  title: String;
  description: String;
  price: Number;
  quantityOrdered: Number;
  image: String;
}
