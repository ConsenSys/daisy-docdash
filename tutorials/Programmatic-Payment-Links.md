
# Programmatically Creating and Querying Payment Links for One Time Payments

> Keep in mind that these instructions are only necessary if you want to automate requesting one time payments. Payment Links can also be sent with just a couple clicks from the [Daisy Dashboard](https://app.daisypayments.com).

---
## <a id="Keys" class="anchor"></a>Finding your ID and Secret Key

First, visit the [Daisy Dashboard](https://app.daisypayments.com) and go to your Organization Settings page.

<div class="img-container" style="width: 700px">
  <img src="./img/organizations_settings.png" alt="Where to find your Organization's settings in the dashboard" />
</div>

In the Integration card at the bottom you will see `identifier` and `secretKey` values for one time payments. These are the values you will supply when instantiating the `ServerPayments` object of [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html).


> In the near future this information will be moving from the Organization Settings page. Instead, it will pe able to create multiple Payment Groups associated with an organization, each with their own `identifier` and `secretKey`.

---
## <a id="Creating" class="anchor"></a>Creating One Time Payments

Once you have [installed and set up DaisySDK](https://docs.daisypayments.com/tutorial-Daisy-SDK.html#Installation) in your backend, create an instance of `ServerPayments` from the `@daisypayments/daisy-sdk/private` submodule. This submodule cannot be instantiated client side, **because it is extremely important that your `secretKey` stays private**.

```js
const DaisySDK = require("@daisypayments/daisy-sdk/private");
const fetch = require("node-fetch");

const payments = new DaisySDK.ServerPayments({
  manager: {
    identifier: process.env.DAISY_OTP_ID,
    secretKey: process.env.DAISY_OTP_SECRET_KEY,
  },
  withGlobals: { fetch },
});
```

Note that `ServerPayments` also requires an instance of `fetch`, passed in as it is shown above. We recommend [node-fetch](https://www.npmjs.com/package/node-fetch), which emulates the browser's `window.fetch` in a Node environment.

Now let's look at an example where we want to sell access to a premium podcast for 10 DAI. This example uses [Express](https://expressjs.com/) and the middleware [express-async-handler](https://www.npmjs.com/package/express-async-handler) for the sake of brevity, but of course you can use whichever frameworks and libraries you like.

```js
const express = require("express");
const asyncHandler = require("express-async-handler");

const app = express();

app.get("/api/checkout/invoice/", asyncHandler(async (req, res) => {
  const { user } = req.session;

  // Create the invoice using Daisy SDK
  const invoice = await payments.createInvoice({
    invoicedPrice: 10, // required
    invoicedEmail: user.email, // optional
    invoicedName: user.name, // optional
    invoicedDetail: "Access to premium episode #16", // optional
  });

  // Save and associate invoice["id"] with your user in your database
  ...
});
```

Upon calling `createInvoice()`, a one time payment request was created and, if provided, a Payment Link was sent to to `invoicedEmail`. The returned `invoice` object has the following shape:

```ts
interface PaymentInvoice {
  id: string;
  identifier: string;
  state: PaymentInvoiceState;
  amountPaid: string | BigNumber;
  paidAt?: string;
  address: string;
  tokenAddress: string;
  walletAddress: string;
  invoicedPrice: string;
  invoicedEmail?: string;
  invoicedName?: string;
  invoicedDetail?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export enum PaymentInvoiceState {
  Pending = "PENDING",
  UnderPaid = "UNDER_PAID",
  Paid = "PAID",
  OverPaid = "OVER_PAID",
}
```

---
## <a id="Querying" class="anchor"></a>Querying One Time Payments

Payment requests are usually paid in full with a Payment Link. However, we cannot prevent outside transactions from sending funds to `walletAddress`, meaning the invoice can be partially or completely paid without going through the Payment Link flow. Therefore, it may be necessary sometimes to poll with Daisy to ascertain the state of a payment.

```js
app.get("/api/checkout/state/", asyncHandler(async (req, res) => {
  const user = req.session;

  try {
    const invoice = await payments.getInvoice({
      identifier: user.invoiceId,
    });
    const success = ["PAID", "OVER_PAID"].includes(invoice["state"]);

    res.json({ invoice });
  } catch (error) {
    //
  }
});
```

To get the receipts from any Invoice:

```js
const receipts = await payments.getReceipts({
  identifier: user.invoiceId,
});
```

Receipt object shape:

```ts
interface PaymentReceipt {
  id: string;
  txHash: string;
  account: string;
  amount: string | BigNumber;
  onChainCreatedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}
```