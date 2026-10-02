function clickSubmitButton(event) {
  // event.preventDefault();
  let addToCartForm = document.querySelector('form[action="/cart/add"]');
  let formData = new FormData(addToCartForm);
  fetch("/cart/add.js", {
    method: "POST",
    body: formData
  })
  .then(_ => {
    addGiftWrapping();
  })
}
document.addEventListener("DOMContentLoaded", function() {
  document.querySelector('button[name="add"]').addEventListener('click', clickSubmitButton);

  document.querySelector('form[action$="/cart/add"]').addEventListener('submit', clickSubmitButton);
});