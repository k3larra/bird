export function modal_do_survey(){
    fetch('./resources/modal_do_survey.html')
    .then(response => response.text())
    .then(html => {
        document.querySelector('#modalcontainer2').innerHTML = html;
      })
      .catch(error => {
        console.warn('Something went wrong.', error);
      });
}