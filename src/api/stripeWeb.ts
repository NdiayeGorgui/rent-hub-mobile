import { loadStripe } from "@stripe/stripe-js";


const stripePromise = loadStripe("pk_test_51T4saEL13XKhsSvAVRTgYoPiSsR9otLFgBzR9OfgobHqZbjKN7YyugeJRRVkSP2frn0HzvXpD5mzj2Zqmepeh3xq00Vh1cDmSW");

export const handleWebPayment = async (clientSecret: string) => {

  const stripe = await stripePromise;

  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  // ⚡ version SIMPLE (test rapide sans UI)
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: "pm_card_visa", // 🔥 carte test Stripe
  }
);

  if (error) {
    throw error;
  }

  return paymentIntent;
};