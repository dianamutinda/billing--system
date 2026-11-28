const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const MAC = /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/;
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value) => String(value ?? '').trim();

function validateStaticUser(body = {}) {
  const data = {
    full_name: text(body.full_name),
    phone: text(body.phone),
    ip_address: text(body.ip_address),
    package_id: text(body.package_id),
    mac_address: text(body.mac_address).toLowerCase().replace(/-/g, ':') || null,
    email: text(body.email) || null,
    service_location: text(body.service_location) || null,
    sms_opt_in: body.sms_opt_in !== false,
    whatsapp_opt_in: body.whatsapp_opt_in === true
  };
  const errors = {};
  if (data.full_name.length < 2) errors.full_name = 'Enter the full name';
  if (!/^254\d{9}$/.test(data.phone)) errors.phone = 'Use the format 254XXXXXXXXX';
  if (!IPV4.test(data.ip_address)) errors.ip_address = 'Enter a valid IPv4 address';
  if (!UUID.test(data.package_id)) errors.package_id = 'Choose a package';
  if (data.mac_address && !MAC.test(data.mac_address)) errors.mac_address = 'Invalid MAC address';
  if (data.email && !EMAIL.test(data.email)) errors.email = 'Invalid email';

  return { valid: Object.keys(errors).length === 0, errors, data };
}

module.exports = { validateStaticUser };