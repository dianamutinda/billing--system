const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function initiatePurchase(phone, packageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, packageId }),
    });

    if (response.status === 409) {
      return { status: 'already_active' };
    }

    if (!response.ok) {
      return { status: 'error', code: response.status };
    }

    const data = await response.json();
    return { status: 'ok', token: data.token };
  } catch (err) {
    return { status: 'error', code: null, message: 'network_failure' };
  }
}

export async function getSessionStatus(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { status: 'error', code: response.status };
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return { status: 'error', code: response.status, message: 'bad_response' };
    }

    return data;
  } catch (err) {
    return { status: 'error', code: null, message: 'network_failure' };
  }
}