
async function activate(session) {
    console.log(`[MOCK] Activating access for ${session.phoneNumber} until ${session.expiresAt}`);
    
    return{
        success: true,
        networkUserId: `mock_${session.id}`,
    };

}
module.exports = { activate };