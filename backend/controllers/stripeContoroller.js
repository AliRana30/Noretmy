const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Freelancer = require('../models/Freelancer');

const getFrontendUrl = () => {
    return process.env.ORIGIN || 'https://noretmy.com';
};

async function handleStripeOnboarding(userId, email, country) {
    const frontendUrl = getFrontendUrl();
    const refreshUrl = `${frontendUrl}/withdraw?stripe_refresh=true`;
    const returnUrl = `${frontendUrl}/withdraw?stripe_success=true`;
    
    try {
        let freelancerAccount = await Freelancer.findOne({ userId });

        const needsStripeAccount = !freelancerAccount || !freelancerAccount.stripeAccountId;

        if (needsStripeAccount) {
            try {
                console.log('[Stripe Onboarding] Creating new Stripe account for:', { userId, email, country });
                
                const isDevelopment = process.env.NODE_ENV === 'development';
                
                if (isDevelopment) {
                    console.log('🔧 [DEV MODE] Bypassing Stripe Connect - creating mock account');
                    
                    if (!freelancerAccount) {
                        freelancerAccount = new Freelancer({
                            email,
                            stripeAccountId: `acct_dev_${userId}_${Date.now()}`, // Mock account ID
                            userId: userId,
                            withdrawalMethod: 'stripe',
                            onboardingStatus: 'completed', // Auto-complete in dev
                        });
                    } else {
                        freelancerAccount.stripeAccountId = `acct_dev_${userId}_${Date.now()}`;
                        freelancerAccount.email = email;
                        freelancerAccount.withdrawalMethod = 'stripe';
                        freelancerAccount.onboardingStatus = 'completed';
                    }
                    
                    await freelancerAccount.save();
                    
                    console.log('✅ [DEV MODE] Mock Stripe account created and onboarding completed');
                    return { success: true, freelancerAccount };
                }
                
                const account = await stripe.accounts.create({
                    type: 'standard',
                    country,
                    email,
                });

                console.log('[Stripe Onboarding] Stripe account created:', account.id);

                if (!freelancerAccount) {
                    freelancerAccount = new Freelancer({
                        email,
                        stripeAccountId: account.id,
                        userId: userId,
                        withdrawalMethod: 'stripe',
                        onboardingStatus: 'pending',
                    });
                } else {
                    freelancerAccount.stripeAccountId = account.id;
                    freelancerAccount.email = email;
                    freelancerAccount.withdrawalMethod = 'stripe';
                    freelancerAccount.onboardingStatus = 'pending';
                }

                await freelancerAccount.save();

                const accountLink = await stripe.accountLinks.create({
                    account: account.id,
                    refresh_url: refreshUrl,
                    return_url: returnUrl,
                    type: 'account_onboarding',
                });

                console.log('[Stripe Onboarding] Created onboarding link:', accountLink.url);

                return {
                    success: false,
                    message: 'Stripe account created. Complete onboarding to enable withdrawals.',
                    link: accountLink.url,
                };
            } catch (err) {
                const message = err?.message || 'Stripe onboarding failed.';
                console.error('[Stripe Onboarding] Error creating account:', {
                    message,
                    type: err?.type,
                    code: err?.code,
                    statusCode: err?.statusCode,
                    rawError: err
                });
                
                if (String(message).includes("signed up for Connect") || String(message).includes('docs/connect')) {
                    return {
                        success: false,
                        message: 'Stripe payouts are not configured on this Stripe account (Connect is required). Please use PayPal or enable Stripe Connect.',
                    };
                }
                return { success: false, message };
            }
        }

        try {
            const isDevelopment = process.env.NODE_ENV === 'development';
            const isMockAccount = freelancerAccount.stripeAccountId?.startsWith('acct_dev_');
            
            if (isDevelopment && isMockAccount) {
                console.log('🔧 [DEV MODE] Skipping Stripe API call for mock account');
                freelancerAccount.email = email;
                freelancerAccount.withdrawalMethod = 'stripe';
                freelancerAccount.onboardingStatus = 'completed';
                await freelancerAccount.save();
                
                console.log('✅ [DEV MODE] Mock account ready for withdrawals');
                return { success: true, freelancerAccount };
            }
            
            const account = await stripe.accounts.retrieve(freelancerAccount.stripeAccountId);
            console.log('[Stripe Onboarding] Account status:', { 
                accountId: freelancerAccount.stripeAccountId, 
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled 
            });
            
            if (!account.charges_enabled) {
                const accountLink = await stripe.accountLinks.create({
                    account: freelancerAccount.stripeAccountId,
                    refresh_url: refreshUrl,
                    return_url: returnUrl,
                    type: 'account_onboarding',
                });

                console.log('[Stripe Onboarding] Account not fully enabled, sending onboarding link:', accountLink.url);

                return {
                    success: false,
                    message: 'Complete onboarding before withdrawing funds.',
                    link: accountLink.url,
                };
            }
        } catch (err) {
            const message = err?.message || 'Stripe onboarding failed.';
            console.error('[Stripe Onboarding] Error retrieving account:', message);
            if (String(message).includes("signed up for Connect") || String(message).includes('docs/connect')) {
                return {
                    success: false,
                    message: 'Stripe payouts are not configured on this Stripe account (Connect is required). Please use PayPal or enable Stripe Connect.',
                };
            }
            return { success: false, message };
        }

        freelancerAccount.email = email;
        freelancerAccount.withdrawalMethod = 'stripe';
        freelancerAccount.onboardingStatus = 'completed';
        await freelancerAccount.save();
        
        console.log('[Stripe Onboarding] Onboarding complete for user:', userId, 'email updated to:', email);

        return { success: true, freelancerAccount };
    } catch (error) {
        console.error('[Stripe Onboarding] Unexpected error:', error?.message);
        return { success: false, message: error?.message || 'Stripe onboarding failed.' };
    }
}

const createStripeTransfer = async (amount, destination, description) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const isMockAccount = destination?.startsWith('acct_dev_');
        
        if (isDevelopment && isMockAccount) {
            console.log('🔧 [DEV MODE] Simulating Stripe payout (no real API call)');
            const mockPayout = {
                id: `po_dev_${Date.now()}`,
                amount: amount,
                currency: 'usd',
                status: 'paid',
                destination: destination,
                description: description,
                created: Math.floor(Date.now() / 1000)
            };
            
            console.log('[Stripe Payout] Mock Success:', {
                payoutId: mockPayout.id,
                amount: mockPayout.amount / 100,
                destination,
                status: mockPayout.status
            });
            
            return mockPayout;
        }
        
        const transfer = await stripe.transfers.create({
            amount, // Amount in cents
            currency: 'usd',
            destination: destination, // The connected account ID
            description, // Description for the transfer
        });
        
        console.log('[Stripe Transfer] Success:', {
            transferId: transfer.id,
            amount: transfer.amount / 100,
            destination,
        });
        
        return transfer;
    } catch (error) {
        console.error('[Stripe Transfer] Error:', {
            message: error.message,
            type: error.type,
            code: error.code,
            destination
        });
        
        if (error.code === 'insufficient_funds') {
            throw new Error('Insufficient funds in the platform Stripe account to process this transfer.');
        } else if (error.code === 'account_invalid') {
            throw new Error('The destination Stripe account is invalid or not properly configured.');
        } else if (error.code === 'payouts_not_allowed') {
            throw new Error('The destination Stripe account cannot receive transfers at this time.');
        }
        
        throw new Error(error.message || 'Failed to process the Stripe transfer.');
    }
};

module.exports = { handleStripeOnboarding,createStripeTransfer };
