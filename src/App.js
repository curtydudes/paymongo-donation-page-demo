import React from "react";
import "./App.css";
import axios from "axios";
import { Buffer } from "buffer";
import { useState } from "react";
import donation from "./images/donation.png";

function App() {
  const [amount, setAmount] = useState("");
  const [intentId, setIntentId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [redirect, setRedirect] = useState("");
  const [showModal, setShowModal] = useState(false);

  const donateAmount = () => {
    const options = {
      method: "POST",
      url: "https://api.paymongo.com/v1/payment_intents",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Authorization: 'Basic c2tfdGVzdF9EcGtkdGI1WUJuZHBndEZXM3pROXQ4SFk6',
        Authorization:
          "Basic" +
          " " +
          Buffer.from(
            `${process.env.REACT_APP_PAYMONGO_SECRET_KEY}`,
            "utf8"
          ).toString("base64"),
      },
      data: {
        data: {
          attributes: {
            amount: parseInt(amount),
            payment_method_allowed: ["card", "paymaya"],
            payment_method_options: { card: { request_three_d_secure: "any" } },
            currency: "PHP",
          },
        },
      },
    };

    axios
      .request(options)
      .then(function (response) {
        setIntentId(response.data.data.id);
        setShowModal(!showModal);
        console.log(response.data);
      })
      .catch(function (error) {
        if (amount === "") {
          return alert("Input Amount");
        } else if (amount < 100) {
          return alert("Donate More");
        } else {
          alert("Donate More");
        }
        console.error(error.response);
      });
  };

  const [formInput, setFormInput] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  const onChangeInputForm = (e) => {
    const { name, value } = e.target;
    formInput[name] = value;
    setFormInput({ ...formInput });
  };

  const onSubmitBillingDetails = () => {
    const options = {
      method: "POST",
      url: "https://api.paymongo.com/v1/payment_methods",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization:
          "Basic" +
          " " +
          Buffer.from(
            `${process.env.REACT_APP_PAYMONGO_SECRET_KEY}`,
            "utf8"
          ).toString("base64"),
      },
      data: {
        data: {
          attributes: {
            type: "card",
            details: {
              card_number: formInput.cardNumber,
              exp_month: parseInt(formInput.cardExpiry.split("/")[0]),
              exp_year: parseInt(formInput.cardExpiry.split("/")[1]),
              cvc: formInput.cardCvc,
            },
            billing: {
              name: formInput.fullName,
              email: formInput.email,
            },
          },
        },
      },
    };

    axios
      .request(options)
      .then(function (response) {
        setPaymentId(response.data.data.id);
        console.log(response.data.data.id, "111");
        // onAttachPaymentIntent()
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  const onAttachPaymentIntent = () => {
    console.log(paymentId, "119");
    const options = {
      method: "POST",
      url: `https://api.paymongo.com/v1/payment_intents/${
        intentId && intentId
      }/attach`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization:
          "Basic" +
          " " +
          Buffer.from(
            `${process.env.REACT_APP_PAYMONGO_SECRET_KEY}`,
            "utf8"
          ).toString("base64"),
      },
      data: {
        data: {
          attributes: { payment_method: paymentId },
        },
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data.data);
        var paymentIntent = response.data.data;
        var paymentIntentStatus = paymentIntent.attributes.status;

        if (paymentIntentStatus === "awaiting_next_action") {
          setRedirect(paymentIntent.attributes.next_action.redirect.url);
          // Render your modal for 3D Secure Authentication since next_action has a value. You can access the next action via paymentIntent.attributes.next_action.
        } else if (paymentIntentStatus === "succeeded") {
          alert("Succeeded");
          // You already received your customer's payment. You can show a success message from this condition.
        } else if (paymentIntentStatus === "awaiting_payment_method") {
          alert("Payment Error");
          // The PaymentIntent encountered a processing error. You can refer to paymentIntent.attributes.last_payment_error to check the error and render the appropriate error message.
        } else if (paymentIntentStatus === "processing") {
          // You need to requery the PaymentIntent after a second or two. This is a transitory status and should resolve to `succeeded` or `awaiting_payment_method` quickly.
        }
      })
      .catch(function (error) {
        alert(error?.response?.data?.errors[0]?.detail);
        // console.log(error.response.data.data.errors[0].details,"152")
        // alert(error.message.detail);
      });
  };

  return (
    <div className="grid_container">
      <div className="left_container">
        <h1 className="header_font">Donation page</h1>
        <h4>by Steven Choy</h4>
        <br />
        <div className="">
          <input
            placeholder="Enter Amount"
            className=""
            onChange={(e) => setAmount(e.target.value * 100)}
          />
        </div>
        <div className="image_container">
          <img src={donation} className="donation_image" />
          <span>
            <button
              onClick={donateAmount}
              className="btn btn-lg"
              id="donate_button"
            >
              Donate Money
            </button>
          </span>
        </div>
        {showModal && intentId && (
          <div className="modal_intent">
            <div className="modal_intent_content">
              <div className="modal_btn_close">
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setShowModal(!showModal)}
                ></button>
              </div>

              {paymentId ? (
                <div className="modal_confimation">
                  <button
                    className="modal_confirmation_button"
                    onClick={onAttachPaymentIntent}
                  >
                    Confirm your transaction
                  </button>
                </div>
              ) : (
                <>
                  <h2> Billing Details </h2>
                  <div>
                    <label>Name</label>
                    <input
                      placeholder="Pay Mongo"
                      name="fullName"
                      onChange={onChangeInputForm}
                    />
                  </div>
                  <br></br>
                  <div>
                    <label>Email</label>
                    <input
                      placeholder="paymongo@gmail.com"
                      name="email"
                      onChange={onChangeInputForm}
                    />
                  </div>
                  <h2> Card Info </h2>
                  <div>
                    <label>Card Number</label>
                    <input
                      placeholder=""
                      name="cardNumber"
                      onChange={onChangeInputForm}
                    />
                  </div>
                  <br></br>
                  <div>
                    <label>Card Expiry Date</label>
                    <input
                      placeholder="1/23"
                      name="cardExpiry"
                      onChange={onChangeInputForm}
                    />
                  </div>
                  <br></br>
                  <div>
                    <label>CVC</label>
                    <input
                      placeholder="000"
                      name="cardCvc"
                      onChange={onChangeInputForm}
                    />
                  </div>
                  <br></br>
                  <button
                    className="modal_close"
                    onClick={() => setShowModal(!showModal)}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal_submit"
                    onClick={onSubmitBillingDetails}
                  >
                    Submit
                  </button>
                </>
              )}
              {redirect && <a href={redirect}>Authorize your payment</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
