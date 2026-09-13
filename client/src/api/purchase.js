const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function initiatePurchase(phone, packageId) {
    const response = await fetch(`${API_BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ phone, packageId}),
    });

    if (response.status === 409){
        return {status: 'already_active'};
    }

    if (!response.ok) {
        return { status: 'error'};
    }

    return { status: 'ok'};
}

export async function getSessionStatus(phone) {
    const response = await fetch(
        `${API_BASE_URL}/api/sessions/status?phone=${encodeURIComponent(phone)}`
    )

    if (!response.ok){
        return {status: 'error'};
    }

    return response.json();
}