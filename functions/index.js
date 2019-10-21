const functions = require('firebase-functions');
const request = require('request-promise-native');
const admin = require('firebase-admin');

const client_id = '0BE38CFF-F3B6-4D68-8F16-1CE270C028BC';
const client_secret = 'DkRUi6uo6KzglHmwOhFkVYNhcumCTOlP';

admin.initializeApp()

async function getBeyondAuthToken(access_token_url, code, signature, client_id, client_secret) {
    // optional but recommended: check signature from query
    if (generateSignature(code, access_token_url) !== signature) throw new Error('Signature does not match!')

    const response = await request(access_token_url, {
        method: 'POST',
        auth: {
            user: client_id,
            pass: client_secret
        },
        form: {
            grant_type: 'authorization_code',
            code
        }
    })

    return response;
}

function generateSignature(code, access_token_url, client_secret) {
  const hmac = crypto.createHmac('sha1', client_secret)
  hmac.update(`${code}:${access_token_url}`)
  return hmac.digest('base64')
}

exports.installBeyondApp = functions.https.onCall(async (data, context) => {
    const {access_token_url, code, api_url, signature} = data;
    const uid = context.auth.uid;

    const response = await getBeyondAuthToken(access_token_url, code, signature, client_id, client_secret);

    await admin.firestore().collection('users').doc(uid).set({
        api_url,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
    })

    return {status: 'success'};
})
