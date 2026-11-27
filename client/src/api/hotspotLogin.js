const LOCAL_IP = /^(10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2})$/;
export function connectToHotspot(username, password) {
  const action = sessionStorage.getItem('hotspotLogin');
  if (!action) return false;
  const url = new URL(action);
  if (url.protocol !== 'http:' || !LOCAL_IP.test(url.hostname)) return false;

  const form = document.createElement('form');
  form.method = 'post';
  form.action = url.href;
  for (const [name, value] of Object.entries({ username, password })) {
    const input = Object.assign(document.createElement('input'), { type: 'hidden', name, value });
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  return true;
}