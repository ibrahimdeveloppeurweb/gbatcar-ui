import Swal from 'sweetalert2/dist/sweetalert2.js';

export class NoInternetHelper {
  static internet() {
    Swal.fire({
      title: 'OUPS !',
      text: 'Pas de connexion internet !',
      icon: 'question',
      iconHtml: '<i class="feather icon-wifi-off" width="50" height="50"></i>',
      timer: 4000,
      allowOutsideClick: false,
      showConfirmButton: false,
    })
  }
}
