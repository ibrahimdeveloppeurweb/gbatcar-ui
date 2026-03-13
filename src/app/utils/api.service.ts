import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = environment.serverUrl;

  constructor(public http: HttpClient) { }

  _get(endpoint: string, params?: any, reqOpts?: any) {
    if (!reqOpts) {
      reqOpts = {
        params: new HttpParams()
      };
    }

    if (params) {
      reqOpts.params = new HttpParams();
      for (const k in params) {
        if (params.hasOwnProperty(k)) {
          reqOpts.params = reqOpts.params.set(k, params[k]);
        }
      }
    }
    return this.http.get(this.url + "/" + endpoint, reqOpts);
  }

  _post(endpoint: string, body: any, reqOpts?: any) {
    return this.http.post(this.url + "/" + endpoint, body, reqOpts);
  }

  _put(endpoint: string, body: any, reqOpts?: any) {
    return this.http.put(this.url + "/" + endpoint, body, reqOpts);
  }

  _patch(endpoint: string, body: any, reqOpts?: any) {
    return this.http.patch(this.url + "/" + endpoint, body, reqOpts);
  }

  _delete(endpoint: string, reqOpts?: any) {
    return this.http.delete(this.url + "/" + endpoint, reqOpts);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ApiUrlService {
  url = environment.serverUrl;

  constructor(public http: HttpClient) { }

  _get(endpoint: string, params?: any, reqOpts?: any) {
    if (!reqOpts) {
      reqOpts = {
        params: new HttpParams()
      };
    }

    if (params) {
      reqOpts.params = new HttpParams();
      for (const k in params) {
        if (params.hasOwnProperty(k)) {
          reqOpts.params = reqOpts.params.set(k, params[k]);
        }
      }
    }
    return this.http.get(this.url + "/" + endpoint, reqOpts);
  }

  _post(endpoint: string, body: any, reqOpts?: any) {
    return this.http.post(this.url + "/" + endpoint, body, reqOpts);
  }

  _put(endpoint: string, body: any, reqOpts?: any) {
    return this.http.put(this.url + "/" + endpoint, body, reqOpts);
  }

  _patch(endpoint: string, body: any, reqOpts?: any) {
    return this.http.patch(this.url + "/" + endpoint, body, reqOpts);
  }

  _delete(endpoint: string, reqOpts?: any) {
    return this.http.delete(this.url + "/" + endpoint, reqOpts);
  }
}
