# Getting Started with Daisy Widget

Daisy Widget is a library of React components that makes interacting with the full lifecycle of payments and subscriptions convenient and straightforward. It is designed to be used within your project's existing frontend. This guide will go through creating a [subscription signup flow](#SignUp), [token approval flow](#ApproveMore), and [cancellation flow](#Cancellation).

<div class="img-container" style="width: 543px">
  <img src="./img/signup_flow.png" alt="Placeholder for ApproveInput, ApproveButton, SubscribeButton, and StepIndicator" />
</div>

> Daisy Widget is just one of three possible ways for your users to pay with Daisy. If you're looking for even more flexibility, you can build everything you need directly with [Daisy SDK](https://docs.daisypayments.com/tutorial-Daisy-SDK.html). If you're looking for an almost-no-code solution, check out [Payment Links](https://docs.daisypayments.com/tutorial-Payment-Links.html). 

---
## <a id="Installation" class="anchor"></a>Installation and Set Up

Begin by adding the `@daisypayments/daisy-widget` package to your project. You must also add `web3@=1.0.0-beta.37` for the dependency [`react-metamask`](https://github.com/ConsenSys/react-metamask) to work (the specific version is important here).

```nocode
yarn add @daisypayments/daisy-widget web3@=1.0.0-beta.37
```

Next, Daisy Widget components require the use of two [React Contexts](https://reactjs.org/docs/context.html), [`MetaMaskContext`]() and [`DaisyContext`](). We recommend wrapping your entire app with their respective Context Providers (in the order shown below):


```js
// Root of your React app

import { MetaMaskContext, DaisyContext } from "@daisypayments/daisy-widget";
```
```html
<MetaMaskContext.Provider immediate>
  <DaisyContext.Provider
    value={{ identifier: "acme-co-subscription-service-id" }}
  >
    <YourApp />
  </DaisyContext.Provider>
</MetaMaskContext.Provider>
```

We recommend that you pass `MetaMaskContext.Provider` the `immediate` prop, otherwise you are responsible for calling  `react-metamask`'s `openMetaMask()` function to authorize web3 access where needed. `DaisyContext.Provider` requires an object for the `value` prop, with the `identifier` key set to your subscription service's globally unique `id`.

<div class="img-container" style="width: 700px">
  <img src="./img/subscription_service_id.png" alt="Where to find your subscription service's id in the dashboard" />
</div>

With that done, whenever you would like a component to access [MetaMask utilities](https://github.com/ConsenSys/react-metamask) or the [Daisy object](https://docs.daisypayments.com/module-browser-DaisySDK.html), you can provide them as props by simply wrapping the component with the [Higher-Order Components](https://reactjs.org/docs/higher-order-components.html), `withMetaMask()` and `withDaisy()`, in the order shown below:  

```js
const EnhancedSubscriptionPage = withMetaMask(withDaisy(SubscriptionPage));
```
---
## <a id="SignUp" class="anchor"></a>Signing Up for a Subscription

Signing up for a subscription requires the [`ApproveButton`](/[#approve-button) and [`SubscribeButton`](/#subscribe-button) components, and the optional, but recommended [`ApproveInput`](/#approve-input), [`StepIndicator`](/#step-indicator), and [`Toast`](/#toast) components.

<div class="img-container" style="width: 621px">
  <img src="./img/signup_flow_parts.png" alt="Placeholder for ApproveInput boxed off as optional, ApproveButton and SubscribeButton boxed off as required, and StepIndicator boxed off as optional" />
</div>

**Two buttons are needed because signing up is a two step process.**

First, the user must make a transaction approving the subscription contract to transfer tokens from their wallet.

Second, the user must sign the details of the subscription agreement using MetaMask.

---
### <a id="ApprovalStep" class="anchor"></a>Approval Step 

Instantiate `ApproveButton`, passing the name of an existing plan within the subscription service as `plan`.

```js
// Signup page of your React app

import { ApproveButton } from "@daisypayments/daisy-widget";
```
```html
<ApproveButton plan="anvilMysteryBoxMonthly" />
```

Clicking the button will open MetaMask and prompt the user to approve the number of tokens that the subscription contract is allowed to transfer from their wallet. The number of tokens to approve can be defined in one of three ways.

The first, recommended way is to use Daisy Widget's `ApproveInput` component. `ApproveInput` provides the user an intuitive way of defining the approval amount in terms of either tokens or billing periods. The component accepts an optional `periods` prop to define the initial number of billing currentlyAllowedPeriods; its default value is 12.

<div class="img-container" style="width: 322px">
  <img src="./img/approve_input.png" alt="Placeholder for ApproveInput" />
</div>

```js
import { ApproveInput } from "@daisypayments/daisy-widget";
```
```html
<ApproveInput plan="anvilMysteryBoxMonthly" />
```

Second, if `ApproveInput` is not used, `ApproveButton` accepts an `approvalAmount` prop which sets the number of tokens to approve.

```js
import { ApproveButton } from "@daisypayments/daisy-widget";
```
```html
<ApproveButton 
  plan="anvilMysteryBoxMonthly" 
  approvalAmount="200" 
/>
```

Finally, if neither `ApproveInput` is used nor the `approvalAmount` prop defined, the number of tokens defaults to the amount needed to pay for 12 billing periods. If more than one of these three ways is provided, Daisy Widget assigns priority in the order they are listed above (e.g. the value from `ApproveInput` would overrule the `approvalAmount` prop).

If you would like to conditionally render any part of this flow based on the user's current allowance of approved tokens, use [Daisy SDK's](https://docs.daisypayments.com/module-browser-DaisySDK.html) `allowance()` function.

```js
const token = daisy.loadToken();
const currentAllowance = await daisy
  .prepareToken(token)
  .allowance({ tokenOwner: account });
```

---
### <a id="SignAndSubmitStep" class="anchor"></a>Sign and Submit Step 

Next, instantiate `SubscribeButton` and pass it the same `plan` name. 

```js
// Signup page of your React app

import { SubscribeButton } from "@daisypayments/daisy-widget";
```
```html
<SubscribeButton plan="anvilMysteryBoxMonthly" />
```

Clicking the button will open MetaMask and prompt the user to sign the details of the subscription agreement. Once signed, the agreement is sent to Daisy to be executed on the Ethereum blockchain by one of two ways. 

**Backend Way**: The first, recommended way is to pass a `handleSignedAgreement` prop to `SubscribeButton`. This handler is responsible for sending the signed agreement to your backend where it needs to be submitted with [`submit()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#submit), and then returning the server response. 

```js
const signedAgreementHandler = async submitArgs => {

  try {
    // Send signed agreement to backend which calls daisy.submit(), 
    // stores the returned daisyId, and then returns the response
    const response = await fetch("/submit_agreement/", {
      method: "POST",
      body: JSON.stringify(submitArgs),
      headers:{
        "Content-Type": "application/json"
      }
    })
    return response;
  } catch (error) {
    ...
  }
}
```
```html
<SubscribeButton
  plan="anvilMysteryBoxMonthly"
  handleSignedAgreement={signedAgreementHandler}
/>
```

**Frontend Way**: If `handleSignedAgreement` is omitted, the agreement is submitted with [`submit()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#submit) immediately and `SubscribeButton`'s `handleSubscriptionCreation` prop is called with the server response.

**Whether the agreement is submitted from your backend or frontend, it is very important to associate the returned `daisyId` with the user at this step!**

 We recommend the **Backend Way** as it avoids any risk of `daisyId` being lost when sent from the user's browser to your backend. But, if you choose not to use `handleSignedAgreement` and do the agreement submission entirely from the frontend, **be sure to associate the response's `daisyId` with the user in `handleSubscriptionCreation`!** 


```js
// NOTE: Previous example preferred to this example!
const subscriptionHandler = async subscription => {

  try {
    // Store user updated with daisyId on backend
    const updatedUser = await fetch("/update_user/", {
      method: "PATCH",
      body: JSON.stringify({
        ...this.props.user, 
        daisyId: subscription.daisyId
      }),
      headers:{
        "Content-Type": "application/json"
      }
    })
    ...
  } catch (error) {
    ...
  }
}
```
```html
<SubscribeButton
  plan="anvilMysteryBoxMonthly"
  handleSubscriptionCreation={subscriptionHandler}
/>
```

And that's it! Your page is now ready to accept subscribers!  
From here you will likely want to provide a way for existing subscribers to [approve more tokens](#token-approval), [view their subscription details](https://docs.daisypayments.com/module-browser-DaisySDK.html#getSubscription), and [cancel their subscription](#cancellation).

---
## <a id="ApproveMore" class="anchor"></a>Approving More Tokens for an Existing Subscription

<div class="img-container" style="width: 350px">
  <img src="./img/approving_tokens.png" alt="Placeholder for ApproveInput and ApproveButton" />
</div>

Every billing period, the price of the plan will be subtracted from the amount of tokens the user has approved. Once all approved tokens have been spent, the user will need to
approve more to continue the subscription. Luckily, doing so is easy. Simply display the same `ApproveInput` and `ApproveButton` components to subscribed users somewhere within your app. We recommend still including the `Toast` component on this page unless you want to be in charge of error handling, but `SubscribeButton` and `StepIndicator` should be left out.

```js
// Subscriber account page of your React app

import { ApproveButton, ApproveInput, Toast } from "@daisypayments/daisy-widget";
```
```html
<ApproveInput plan="anvilMysteryBoxMonthly" />
<ApproveButton plan="anvilMysteryBoxMonthly" />
<Toast />
```
---
## <a id="Cancellation" class="anchor"></a>Cancelling a Subscription

Occasionally a user will need to cancel their subscription. Just as there are `ApproveButton` and `SubscribeButton` components, there is a `CancelButton` as well. Unlike the previous two buttons, `CancelButton` requires the `subscription` object as a prop in addition to the `plan` name. The `subscription` object can be obtained from [`getSubscription()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#getSubscription).
```js
// Subscriber account page of your React app

import { CancelButton } from "@daisypayments/daisy-widget";

const subscription = await daisy.getSubscription(this.props.user.daisyId);
```
```html
<CancelButton
  plan="anvilMysteryBoxMonthly"
  subscription={subscription}
/>
<Toast />
```
Clicking the button will open MetaMask and prompt the user to sign the details of the cancellation.  Similar to `SubscribeButton`, the signed cancellation is sent to Daisy by one of two ways. Neither way is strongly preferred over the other as there is no fear of data loss, so feel free to use whichever suits your needs best. 

**Backend Way**:  If you would like to handle submitting the signed cancellation with [`submitCancel()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#submitCancel) from your backend, a handler is exposed for you to do so, `handleSignedCancellation`. Once again, this handler is responsible for returning the server response. 

```js
const handleCancel = async submitArgs => {

  try {
    // Send signed cancellation to backend, which calls 
    // daisy.submitCancel(), and then returns the response
    const response = await fetch("/submit_cancel/", {
      method: "POST",
      body: JSON.stringify(submitArgs),
      headers:{
        "Content-Type": "application/json"
      }
    })
    return response;
  } catch (error) {
    ...
  }
}
```
```html
<CancelButton
  plan="anvilMysteryBoxMonthly"
  subscription={subscription}
  handleSignedCancellation={handleCancel}
/>
```

**Frontend Way**: If `handleSignedCancellation` is omitted, the agreement is submitted with [`submitCancel()`](https://docs.daisypayments.com/module-browser-DaisySDK.html#submitCancel) immediately

In both the **Backend Way** and the **Frontend Way**, if the `handleSubscriptionCancellation` prop is passed to `CancelButton`, it is called with the server response.

---
## <a id="UserRequirements" class="anchor"></a>What is Required of the User?

A user on your site is interested in subscribing to your service. There are some prerequisites to signing up for non-fiat denominated subscriptions. What do they need?  The user must:

- Have [MetaMask](https://metamask.io/) installed or be using a dapp browser (for approving tokens and signing the subscription agreement).
- Have enough of one of the subscription's accepted ERC20 tokens to pay for at least one billing period.
- Have enough ETH to pay the gas fee of the approval step (almost always less than $0.10 USD).

Luckily, if any of these requirements are not met, Daisy Widget can do the work of surfacing actionable error messages to the user for you with the optional [Toast component](/#toast).

---

Still have questions after reading this guide? Feel free to contact us at [hello@daisypayments.com](mailto:hello@daisypayments.com).
