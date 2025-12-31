const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Freelancer = require('../models/Freelancer');

async function handleStripeOnboarding(userId,email, country) {
    try {
        let freelancerAccount = await Freelancer.findOne({ userId });

        // If account doesn't exist, create a new Stripe account and Freelancer record
        if (!freelancerAccount) {
            const account = await stripe.accounts.create({
                type: 'standard',
                country,
                email,
            });

            freelancerAccount = new Freelancer({
                email,
                stripeAccountId: account.id,
                userId : userId,
            });

            await freelancerAccount.save();

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'https://noretmy.com/onboarding-refresh',
                return_url: 'https://noretmy.com/onboarding-success',
                type: 'account_onboarding',
            });

            return {
                success: false,
                message: 'Freelancer account created. Complete onboarding.',
                link: accountLink.url,
            };
        }

        // Check if onboarding is complete
        const account = await stripe.accounts.retrieve(freelancerAccount.stripeAccountId);
        if (!account.charges_enabled) {
            const accountLink = await stripe.accountLinks.create({
                account: freelancerAccount.stripeAccountId,
                refresh_url: 'https://noretmy.com/onboarding-refresh',
                return_url: 'https://noretmy.com/onboarding-success',
                type: 'account_onboarding',
            });

            return {
                success: false,
                message: 'Complete onboarding before withdrawing funds.',
                link: accountLink.url,
            };
        }

        return { success: true, freelancerAccount };
    } catch (error) {
        throw new Error(error.message);
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

        const freelancer = await Freelancer.findOne({ email });

        return transfer;
    } catch (error) {
        console.error('Stripe Transfer Error:', error);
        throw new Error('Failed to process the Stripe transfer.');
    }
};

module.exports = { handleStripeOnboarding,createStripeTransfer };
