const calculateDeliveryDate = (days) => {
    if (typeof days !== "number" || days < 0) {
        throw new Error("Invalid delivery time. Must be a positive number.");
    }
    const today = new Date();
    return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
};

module.exports = { calculateDeliveryDate };
