export const initiateMobileMoneyCollection = async (
    amount: number,
    phoneNumber: string,
    reference: string,
    operator: 'mtn' | 'airtel'
) => {
    // DEBUG: Log env variable status
    console.log('DEBUG: LENCO_API_TOKEN exists?', !!process.env.LENCO_API_TOKEN);
    console.log('DEBUG: LENCO_API_URL_TEST exists?', !!process.env.LENCO_API_URL_TEST);
    console.log('DEBUG: All LENCO env vars:', Object.keys(process.env).filter(k => k.includes('LENCO')));

    const url = process.env.LENCO_API_URL_TEST;
    const apiKey = process.env.LENCO_API_TOKEN; // Make sure to add this to your .env

    if (!apiKey) {
        throw new Error('LENCO_API_TOKEN is not configured');
    }

    if (!url) {
        throw new Error('LENCO_API_URL_TEST is not configured');
    }

    const payload = {
        amount,
        phone: phoneNumber,
        reference,
        operator,
        country: 'zm', // Defaulting to Zambia
        bearer: 'merchant' // You pay the fees (standard for billing), or change to 'customer'
    };

    console.log('DEBUG: initiateMobileMoneyCollection called');
    console.log('DEBUG: Lenco API URL:', url);
    console.log('DEBUG: Lenco API Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('DEBUG: Lenco API Response Status:', response.status);
        const data = await response.json();
        console.log('DEBUG: Lenco API Response Body:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('DEBUG: Lenco API Error Message:', data.message);
            throw new Error(data.message || 'Failed to initiate mobile money payment');
        }

        return data;
    } catch (error) {
        console.error('DEBUG: Lenco API Exception:', error);
        throw error;
    }
};
