'use strict';


const API_URL = 'http://www.raydelto.org/agenda.php';
const form = document.getElementById('contact-form');
const list = document.getElementById('contact-list');
const count = document.getElementById('contact-count');
const search = document.getElementById('search');
const formMessage = document.getElementById('form-message');
const listMessage = document.getElementById('list-message');
const saveButton = document.getElementById('save-button');
const refreshButton = document.getElementById('refresh-button');
let contacts = [];

function showMessage(element, text, type = 'info') {
  element.textContent = text;
  element.className = 'message ' + type;
}

function initials(name, surname) {
  return ((name.trim().charAt(0) || '') + (surname.trim().charAt(0) || '')).toUpperCase() || '?';
}

function renderContacts() {
  const term = search.value.trim().toLocaleLowerCase();
  const filtered = contacts.filter(contact =>
    [contact.nombre, contact.apellido, contact.telefono]
      .some(value => String(value ?? '').toLocaleLowerCase().includes(term))
  );
  count.textContent = String(contacts.length);
  list.replaceChildren();
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = term ? 'No se encontraron contactos con esa búsqueda.' : 'No hay contactos para mostrar.';
    list.appendChild(empty);
    return;
  }
  filtered.forEach(contact => {
    const name = String(contact.nombre ?? '');
    const surname = String(contact.apellido ?? '');
    const phone = String(contact.telefono ?? '');
    const item = document.createElement('article');
    item.className = 'contact';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = initials(name, surname);
    const info = document.createElement('div');
    const fullName = document.createElement('div');
    fullName.className = 'contact-name';
    fullName.textContent = (name + ' ' + surname).trim() || 'Sin nombre';
    const number = document.createElement('div');
    number.className = 'contact-phone';
    number.textContent = phone || 'Sin teléfono';
    info.append(fullName, number);
    item.append(avatar, info);
    list.appendChild(item);
  });
}

async function loadContacts() {
  refreshButton.disabled = true;
  showMessage(listMessage, 'Cargando contactos...', 'info');
  try {
    const response = await fetch(API_URL, { method: 'GET' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('El servidor no devolvió una lista JSON.');
    contacts = data;
    renderContacts();
    showMessage(listMessage, '', 'info');
  } catch (error) {
    console.error('Error al consultar la agenda:', error);
    showMessage(listMessage, 'No se pudieron cargar los contactos. Verifica la conexión y los permisos CORS del servicio.', 'error');
    list.replaceChildren();
    count.textContent = '0';
  } finally {
    refreshButton.disabled = false;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const contact = {
    nombre: document.getElementById('nombre').value.trim(),
    apellido: document.getElementById('apellido').value.trim(),
    telefono: document.getElementById('telefono').value.trim()
  };
  if (!contact.nombre || !contact.apellido || !contact.telefono) {
    showMessage(formMessage, 'Completa todos los campos.', 'error');
    return;
  }
  saveButton.disabled = true;
  showMessage(formMessage, 'Guardando contacto...', 'info');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    form.reset();
    showMessage(formMessage, 'Contacto enviado correctamente. Actualizando la lista...', 'success');
    await loadContacts();
  } catch (error) {
    console.error('Error al guardar el contacto:', error);
    showMessage(formMessage, 'No se pudo confirmar el guardado. Revisa la conexión, CORS y la consola del navegador.', 'error');
  } finally {
    saveButton.disabled = false;
  }
});

search.addEventListener('input', renderContacts);
refreshButton.addEventListener('click', loadContacts);
loadContacts();
