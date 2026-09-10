
async function activate(session) {
    console.log(`[MOCK] Activating access for ${session.phoneNumber} until ${session.expiresAt}`);
    
    return{
        success: true,
        networkUserId: `mock_${session.id}`,
    };

}

async function revoke(session) {
    console.log(`[MOCK] Revoking access for ${session.phoneNumber} (session ${session.id})`);
    
    return {
        success: true
    };
}
module.exports = { activate, revoke };