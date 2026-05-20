import * as WebBrowser from "expo-web-browser";
import { API } from "./api";

export const handleMobilePayment = async (clientSecret: string) => {
  // clientSecret format: pi_xxxxx_secret_yyyyy
  const paymentIntentId = clientSecret.split("_secret_")[0];

  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer pk_test_51TXjIjQaWL0C4PvN4RI3bc64LFKfzevr70JI1LAUaSykVSFcSfzvJKccMg8azKrfDwf2Am2J0pqmBG6Wz9AAZyL400KCjjQiZs`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_secret=${encodeURIComponent(clientSecret)}&payment_method=pm_card_visa`,
    }
  );

  const data = await response.json();
  console.log("STRIPE RESPONSE:", JSON.stringify(data));

  if (data.error) throw new Error(data.error.message);
  return data;
};