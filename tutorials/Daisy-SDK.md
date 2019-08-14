# Getting Started with Daisy SDK

Daisy SDK is a library for interacting with all aspects of the Daisy product in both a browser and Node environment. This guide will go through using the library to [sign up for a new subscription](#SignUp), [access a subscription's current state and subscriber data](#Access), [approve tokens for an existing subscription](#ApproveMore), and [cancel an existing subscription](#Cancellation).


> Daisy SDK is just one of three possible ways for your users to pay with Daisy, and it is certainly the most involved way. If your project has a React frontend, most payment and subscription actions can be performed using the pre-built React components of [Daisy Widget](https://docs.daisypayments.com/tutorial-Daisy-Widget.html). If you're looking for an almost-no-code solution, check out Invitations (documentation coming soon). 

---
## Installation and Set Up

Begin by adding the `@daisypayments/daisy-sdk` package to your project.

```nocode
yarn add @daisypayments/daisy-sdk
```

If you are using Daisy SDK within a React frontend, we strongly recommend that you also install [`react-metamask`](https://github.com/ConsenSys/react-metamask) to provide [`web3`](https://github.com/ethereum/web3.js/). It is important to specifically install version `web3@=1.0.0-beta.37`.

```nocode
yarn add @daisypayments/react-metamask web3@=1.0.0-beta.37
```

Next, how you import the SDK depends on where you are using it.

### <a id="FrontendSetUp" class="anchor"></a>Frontend

<img src="./img/subscription-service-id-and-key.png" alt="Where to find your subscription product's id and key in the dashboard" width="700"/>

In your project's frontend, everything is done through the [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) class. The [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) constructor takes an object with the `identifier` key set to your subscription product's globally unique `id` as its first argument, and a `web3` instance as its second.

Below is an example of getting `web3` from `react-metamask`, and using that to instantiate [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) inside of a React component, `PageWithDaisy`. Note how `PageWithDaisy` is wrapped with the [Higher-Order Component](https://reactjs.org/docs/higher-order-components.html), `withMetaMask()`. This `withMetaMask()` function from `react-metamask` differs from the one provided by `daisy-widget`.
```js
// MetaMaskContext.js

import { createMetaMaskContext } from "@daisypayments/react-metamask";
const MetaMaskContext = createMetaMaskContext();
export default MetaMaskContext;


// PageWithDaisy.js

import React, { Component } from "react";
import DaisySDK from "@daisypayments/daisy-sdk";
import { withMetaMask } from "@daisypayments/react-metamask";
import MetaMaskContext from "./MetaMaskContext";

class PageWithDaisy extends Component {

  componentDidMount() {
    const { web3 } = this.props.metamask;
    if (web3) {
      const daisy = new DaisySDK({ identifier: "acme-co-subscription-service-id" }, web3);
      ...
    }
  }

  ...
}

export default withMetaMask(MetaMaskContext)(PageWithDaisy);
```

An example of instantiating [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) outside of a React project.
```js
import DaisySDK from "@daisypayments/daisy-sdk";
import Web3 from "web3";

const web3 = new Web3(...); // Replacing ... with a provider from the browser or MetaMask
const daisy = new DaisySDK({ identifier: "acme-co-subscription-service-id" }, web3)
```

### <a id="BackendSetUp" class="anchor"></a>Backend

In your project backend import [`ServiceSubscriptions`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html) instead of [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html), and import it from the module `@daisypayments/daisy-sdk/private`, not `@daisypayments/daisy-sdk`. It is instantiated with your subscription product's `identifier` and `secretKey`, but not `web3` as it is not interacting with MetaMask or a dapp browser. **The secret key should be stored as an environment variable on your server and not hard coded. Keep this value private and never use it in your frontend code!** 

```js
const { ServiceSubscriptions } = require("@daisypayments/daisy-sdk/private");

const subscriptionService = new ServiceSubscriptions({
  identifier: "acme-co-subscription-service-id",
  secretKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
});
```

Both [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) and [`ServiceSubscriptions`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html) extend the [SubscriptionProductClient](https://docs.daisypayments.com/module-common-SubscriptionProductClient.html) class.

---
## <a id="SignUp" class="anchor"></a>Signing Up for a Subscription


Signing up for a subscription is a two step process: First, the user must make a transaction approving the subscription contract to transfer tokens from their wallet. Second, the user must sign the details of the subscription agreement using MetaMask or a dapp browser and that signed agreement must be submitted to Daisy.

---
### <a id="ApprovalStep" class="anchor"></a>Approval Step

The approval step takes place entirely in your frontend. With [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) instantiated the same way we saw above, the first step is to call [`sync()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#sync) to ensure that the subscription manager is up to date. We then call [`loadToken()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#loadToken) to fetch the contract of the token that the subscription is denominated in. The amount of tokens to approve can be defined by the application or by an input field; ideally it is many multiples of the plan price so that the user does not have to frequently approve more tokens. The amount must be defined as a string and in the smallest unit possible (18 decimal places for most ERC20 tokens). The user account (wallet address) should be defined by MetaMask or the dapp browser.

```js
const daisy = new DaisySDK({ identifier: "acme-co-subscription-service-id" }, web3);

await daisy.sync();

const token = daisy.loadToken();

// Defined by the application or by the user, ideally much greater than the plan price
const approvalAmount = "12000000000000000000";

// If using react-metamask, accessible from this.props.metamask.accounts[0]
const account = "0x47e4...";

const eventemitter = daisy
  .prepareToken(token)
  .approve(approvalAmount, { from: account });
```

[`prepareToken()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#prepareToken) takes the token contract and wraps it with some simple error handling, but the call to `approve()` is essentially just sending the approve transaction with [`web3`](https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#methods-mymethod-send) like so:


```js
// Roughly equivalent to approve() in the example above
tokenContract.methods["approve"](subscriptionContract, amount).send({
  from: account
});
```

The user is then prompted by MetaMask or their dapp browser to send the transaction. Upon doing so, a [`PromiEvent`](https://web3js.readthedocs.io/en/v1.2.0/callbacks-promises-events.html#promievent) is returned, on which you can optionally attach handlers.

```js
eventemitter
  .on("transactionHash", handleApproveTransactionHash)
  .on("confirmation", handleApproveConfirmation)
  .on("receipt", handleApproveReceipt)
  .on("error", handleApproveError);

function handleApproveTransactionHash(transactionHash) { ... };
function handleApproveConfirmation(confirmationNumber, receipt) { ... };
function handleApproveReceipt(receipt) { ... };
function handleApproveError(error) { ... };
```

---
### <a id="SignAndSubmitStep" class="anchor"></a>Sign and Submit Step 

With the subscription contract approved to transfer tokens from the user's wallet, the next and last step is signing the subscription agreement and submitting it to Daisy to be executed on the Ethereum blockchain. The first four lines of code below are the same as in the approval step. The additional piece of data needed is the specific `plan` object that the user is subscribing to. Plans can be accessed from either the frontend or backend (using [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html) or [`ServiceSubscriptions`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html), respectively) with the same method, [`getData()`](https://docs.daisypayments.com/module-common-SubscriptionProductClient.html#getData). 

```js
const daisy = new DaisySDK({ identifier: "acme-co-subscription-service-id" }, web3);

await daisy.sync();

const token = daisy.loadToken();

// If using react-metamask, accessible from this.props.metamask.accounts[0]
const account = "0x47e4...";

// In practice probably not called immediately before sign()
const { plans } = await daisy.getData();

const { signature, agreement } = await daisy
  .prepareToken(token)
  .sign({ account, plan: plans[0] });
```

Then, instead of calling `approve()` we call the `sign()` function, prompting the user to sign the details of the subscription agreement with MetaMask or the dapp browser. Once signed, the agreement is sent to Daisy to be executed on the Ethereum blockchain by one of two ways.

**Whether the agreement is submitted from your backend or frontend, it is very important to associate the returned `daisyId` with the user at this step!**

**Backend Way:** The first, recommended way is to provide an endpoint on your backend that is responsible for submitting the signed agreement with [`submit()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#submit) and then returning the server response. 

```js
// Your frontend

try {
  const response = await fetch("/submit_agreement/", {
    method: "POST",
    body: JSON.stringify({ signature, agreement }),
    headers:{
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
} catch (error) {
  ...
}



// Your backend

const asyncHandler = require("express-async-handler");

app.post("/submit_agreement/", asyncHandler(async (req, res) => {

  const { agreement, signature } = req.body;

  const { data: subscription } = await subscriptionService.submit({
    agreement,
    signature,
  });

  // Associate daisyId with the user
  const daisyId = subscription["daisyId"];
  const { user } = req.session;
  await user.patch({ daisyId });

  res.send(subscription);
}));
```

This example uses [Express](https://expressjs.com/) and the middleware [express-async-handler](https://www.npmjs.com/package/express-async-handler) for the sake of brevity, but of course you can use whatever backend you like as long as you are calling [`submit()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#submit) and associating the returned `daisyId` with the user.

Additionally, if the user is attempting to subscribe to a private plan, the subscription agreement must also be signed with a private `Authorizer` key. Thus, if you are using private plans, you *must* utilize the **Backend Way** to avoid revealing this key. 

The previous example adapted for a private plan is shown below. The key difference is that [`authorize()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#authorize) is now called and the resulting `authSignature` is passed to [`submit()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#submit).

```js
app.post("/submit_agreement/", asyncHandler(async (req, res) => {

  const { agreement, signature } = req.body;

  let authSignature = null;
  if (plan.private) {

    const authorizer = {
      privateKey: Buffer.from(process.env.PRIVATE_KEYS, "hex"),
    };
    authSignature = await subscriptionService.authorize(
      authorizer,
      agreement,
    );
  }

  const { data: subscription } = await subscriptionService.submit({
    agreement,
    authSignature,
    signature,
  });

  ...
```


**Frontend Way:** The [`submit()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#submit) function can also be called from the frontend with [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html). However, we recommend the **Backend Way** as it avoids any risk of `daisyId` being lost when sent from the user's browser to your backend. If you still choose to do the agreement submission entirely from the frontend, **be sure to then send the returned `daisyId` to your backend and associate it with the user!** 


```js
// Your frontend
// NOTE: Previous example preferred to this example!

try {

  const { data: subscription } = await daisy.submit({
    agreement,
    signature,
  });

  // Store user updated with daisyId on backend
  const updatedUser = await fetch("/update_user/", {
    method: "PATCH",
    body: JSON.stringify({
      ...user, 
      daisyId: subscription.daisyId
    }),
    headers:{
      "Content-Type": "application/json"
    }
  });
  ...
} catch (error) {
  ...
}
```

And that's it! You are now ready to accept subscribers!  

From here you will likely want to provide a way for existing subscribers to [view their subscription details](#Access), [approve more tokens](#ApproveMore), and [cancel their subscription](#Cancellation).

---
## <a id="Access" class="anchor"></a>Accessing Subscription State and Subscriber Data

A number of methods are provided for accessing data about your subscription products, as well as the status of a given subscription. Here we demonstrate how you might use them as API endpoints within an [Express](https://expressjs.com/) app, but all of these methods can also be called from the frontend using [`DaisySDK`](https://docs.daisypayments.com/module-browser-DaisySDK.html).


Setup and fetching plans with [`getData()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#getData).
```js
const express = require("express");
const asyncHandler = require("express-async-handler");
const { ServiceSubscriptions } = require("@daisypayments/daisy-sdk/private");

const app = express();

const subscriptionService = new ServiceSubscriptions({
  identifier: "acme-co-subscription-service-id",
  secretKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
});

app.get("/api/plans/", asyncHandler(async (req, res) => {
  const { plans } = await subscriptionService.getData();
  res.send(plans);
}));
```

Fetching receipts with [`getReceipts()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#getReceipts).
```js
app.get("/api/receipts/", asyncHandler(async (req, res) => {
  const daisyId = req.query.id; // Or onChainId
  const receipts = await subscriptionService.getReceipts({ daisyId });
  res.send(receipts);
}));
```

Fetching a subscription with [`getSubscription()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#getSubscription).
```js
app.get("/api/subscription/", asyncHandler(async (req, res) => {
  const daisyId = req.query.id; // Or onChainId
  const subscription = await subscriptionService.getSubscription({ daisyId });
  res.send(subscription);
}));
```

To differentiate between active and inactive subscriptions, use `subscription.state` and `subscription.cancelState`. The full list of possible subscription states and their meanings is available here (coming soon).

Fetching subscriptions that match a filtering criteria with [`getSubscriptions()`](https://docs.daisypayments.com/module-private-ServiceSubscriptions.html#getSubscriptions). Valid properties to filter by are `account` (Ethereum address) and `state`.
```js
app.get("/api/subscriptions/", asyncHandler(async (req, res) => {
  const filterKey = req.query.filterKey;
  const filterValue = req.query.filterValue;
  const subscriptions = await subscriptionService.getSubscriptions({
    [filterKey]: filterValue
  });
  res.send(subscriptions);
}));
```
---
## <a id="ApproveMore" class="anchor"></a>Approving More Tokens for an Existing Subscription

Every billing period, the price of the plan will be subtracted from the amount of tokens the user has approved. Once all approved tokens have been spent, the user will need to
approve more to continue the subscription. Luckily, doing so is easy. Simply expose the same [token approval flow](#ApprovalStep) that we already created to subscribed users somewhere within your app. Leave out the second step of signing and submitting the subscription agreement, that doesn't need to be repeated. 


If you can use [Daisy Widget](https://docs.daisypayments.com/tutorial-Daisy-Widget.html), the `ApproveInput` and `ApproveButton` components [accomplish this task perfectly](https://docs.daisypayments.com/tutorial-Daisy-Widget.html#ApproveMore). If not, be sure to make it obvious to your users how many tokens they have approved and warn them when they are getting low.

---
## <a id="Cancellation" class="anchor"></a>Cancelling a Subscription

Occasionally a user will need to cancel their subscription. Similar to how a user is able to sign a subscription agreement from the frontend, they are also able to sign a cancellation. The arguments for cancelling differ slightly from those required for initiating a subscription; here we need the `subscription`'s `onChainId` instead of the `plan`. The `subscription` object can be obtained from [`getSubscription()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#getSubscription).
```js
// Get subscription of current user
const subscription = await daisy.getSubscription({ 
  daisyId: this.props.user.daisyId
});

// Sign cancellation using MetaMask or browser
const token = daisy.loadToken();
const { agreement, signature } = await daisy
  .prepareToken(token)
  .signCancel({ account, onChainId: subscription.onChainId });

// Send signed cancellation to Daisy
const response = await daisy.submitCancel({ agreement, signature });
```
Calling `signCancel()` will open MetaMask and prompt the user to sign the details of the cancellation.  Similar to the [sign and submit step](#SignAndSubmitStep), the signed cancellation can be sent to Daisy from either your frontend or your backend. Neither way is strongly preferred over the other as there is no fear of data loss, so feel free to call [`submitCancel()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#submitCancel) wherever suits your needs best. 


```js
// Either from your frontend,

const { data: subscription } = await daisy.submitCancel({
  agreement,
  signature,
});


// Or from your backend

app.post("/submit_cancel/", asyncHandler(async (req, res) => {

  const { agreement, signature } = req.body;
  const { data: subscription } = await subscriptionService.submitCancel({
    agreement,
    signature,
  });

  res.send(subscription);
}));
```


---
## <a id="UserRequirements" class="anchor"></a>What is Required of the User?

A user on your site is interested in subscribing to your service. There are some prerequisites to signing up for non-fiat denominated subscriptions. What do they need?  The user must:

- Have [MetaMask](https://metamask.io/) installed or be using a dapp browser (for approving tokens and signing the subscription agreement).
- Have enough of one of the subscription's accepted ERC20 tokens to pay for at least one billing period.
- Have enough ETH to pay the gas fee of the approval step (a quite small amount).

When using Daisy SDK, you are responsible for checking that these requirements are met and informing the user if they are not. An added benefit of using [Daisy Widget](https://docs.daisypayments.com/tutorial-Daisy-Widget.html) is that handling and displaying errors is built-in!

---

Still have questions after reading this guide? We encourage you to chat with us on Slack at #daisy-public, or contact us at [hello@daisypayments.com](mailto:hello@daisypayments.com).
