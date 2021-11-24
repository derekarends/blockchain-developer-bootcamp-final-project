export function validateForm(e: any): boolean {
  const form = document.querySelector('.needs-validation') as HTMLFormElement;
  form.classList.add('was-validated')
  if (!form.checkValidity()) {
    e.stopPropagation();
    return false;
  }
  return true;
}