const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Freelancer = require('../models/Freelancer');

// Get the frontend URL for Stripe redirect URLs
const getFrontendUrl = () => {
    // Priority: ORIGIN env var > fallback to production URL
    return process.env.ORIGIN || 'https://noretmy.com';
};

async function handleStripeOnboarding(userId, email, country) {
    const frontendUrl = getFrontendUrl();
    const refreshUrl = `${frontendUrl}/withdraw?stripe_refresh=true`;
    const returnUrl = `${frontendUrl}/withdraw?stripe_success=true`;
    
    try {
        let freelancerAccount = await Freelancer.findOne({ userId });

        // If Freelancer exists but has no stripeAccountId, we need to create a Stripe account
        const needsStripeAccount = !freelancerAccount || !freelancerAccount.stripeAccountId;

        if (needsStripeAccount) {
            try {
                console.log('[Stripe Onboarding] Creating new Stripe account for:', { userId, email, country });
                
                const account = await stripe.accounts.create({
                    type: 'standard',
                    country,
                    email,
                });

                console.log('[Stripe Onboarding] Stripe account created:', account.id);

                if (!freelancerAccount) {
                    // Create new Freelancer document
                    freelancerAccount = new Freelancer({
                        email,
                        stripeAccountId: account.id,
                        userId: userId,
                        withdrawalMethod: 'stripe',
                        onboardingStatus: 'pending',
                    });
                } else {
                    // Update existing Freelancer with Stripe account
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
                console.error('[Stripe Onboarding] Error creating account:', message);
                if (String(message).includes("signed up for Connect") || String(message).includes('docs/connect')) {
                    return {
                        success: false,
                        message: 'Stripe payouts are not configured on this Stripe account (Connect is required). Please use PayPal or enable Stripe Connect.',
                    };
                }
                return { success: false, message };
            }
        }

        // Freelancer has a stripeAccountId - check if onboarding is complete
        try {
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

        // Update email, method, and status
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
        const transfer = await stripe.transfers.create({
            amount, // Amount in cents
            currency: 'usd',
            destination, // Stripe account ID of the recipient
            description, // Description for the transfer
        });
        return transfer;
    } catch (error) {
        console.error('Stripe Transfer Error:', error);
        throw new Error('Failed to process the Stripe transfer.');
    }
};

module.exports = { handleStripeOnboarding,createStripeTransfer };
