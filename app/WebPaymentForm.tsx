import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { subscribeToPremium } from "@/src/api/paymentService.web";

const stripePromise = loadStripe("pk_test_xxxxxxxxx");

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // 1️⃣ créer PaymentIntent via ton backend
      const payment = await subscribeToPremium(9.99);

      const clientSecret = payment.clientSecret;

      // 2️⃣ confirmer paiement Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || "Erreur de paiement");
      } else if (result.paymentIntent?.status === "succeeded") {
        alert("Paiement réussi 🎉");
      }

    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <CardElement />

      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Paiement..." : "Passer Premium"}
      </button>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}

export default function WebPaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}