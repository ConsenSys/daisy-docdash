# Getting Started with Invitations

Need to send out payment requests or subscription invitations, with minimal initial code changes to your application? Look no further than Daisy Invitations. With the addition of just one endpoint to your backend, non-technical team members can generate and send invitations with just a couple clicks from the [Daisy Dashboard](https://app.daisypayments.com). 

<div class="img-container" style="width: 700px">
  <img src="./img/invitation.png" alt="Placeholder for an example invitation generated for an end user" />
</div>

> Invitations provide the fastest, easiest way for you to get started with Daisy. However, if you are seeking to incorporate Daisy within your own application, you should use either the pre-built React components offered by [Daisy Widget](https://docs.daisypayments.com/tutorial-Daisy-Widget.html) or the even more flexible library, [Daisy SDK](https://docs.daisypayments.com/tutorial-Daisy-SDK.html).
---
## <a id="SetUp" class="anchor"></a>Initial Set Up for Webhooks

Invitations typically follow this path:

- An invitation to a specific plan has been generated and the link presented to a potential user.
- The user decides to subscribe and completes the quick 5-step signup flow.
- Daisy sends a POST request to an endpoint on your server containing, among other details, the user's `daisyId` and the subscription agreement signed by Daisy.
- After passing any validation rules you have set up, the signed subscription agreement is sent back to Daisy.
- The subscription becomes active and the billing period starts immediately.

Invitations can be used without making any changes to your application, however the experience for your team and for your end users will be greatly improved by using webhooks. Without them, you are responsible for [manually approving new subscribers](#NoWebhooks) and associating their `daisyId` with them in your database. This may be appropriate for small-scale services, but generally is more laborious and error-prone. 

Below is an example endpoint set up to consume invitation webhooks. It is simple but it covers everything this endpoint ought to do: Validate the subscription object, associate the newly generated `daisyId` with the user, and send the signed subscription agreement back to Daisy to signal its correctness.
```js
const express = require("express");
const asyncHandler = require("express-async-handler");

const app = express();


app.post("/api/invitation_webhook/", asyncHandler(async (req, res) => {
  const payload = req.body;
  const { subscription, authSignature } = payload;

  // Check subscription with isValid() custom validation rules
  if ( !isValid( payload ) ) {
    throw ...
  }
    
  // Associate daisyId with the user
  const daisyId = subscription["daisyId"];
  const { user } = req.session;
  await user.patch({ daisyId });

  res.send({ authSignature })
  
}));
```

This example uses [Express](https://expressjs.com/) and the middleware [express-async-handler](https://www.npmjs.com/package/express-async-handler) for the sake of brevity, but of course you can use whatever backend you like.

The complete payload of the POST request looks like:
```js
{
  // Semver of Daisy subscription service
  version: string,
  
  subscription: {
    // Off-chain identifier, primary means of referencing a subscription
    daisyId: string,
  },
  
  // Plan being subscribed to
  plan: {
    id: string,
    private: boolean,
  },
  
  // Invitation that was used
  invitation: {
    id: string,
    automatic: boolean,
  },
  
  // Details of subscription including price, token, periods, periodUnits, etc.
  agreement: object,
  
  /* When subscriptions are automatically signed (see "Approval Method" below), 
    this field contains the authorizer signature */
  authSignature: string | null, 
  
  // Project defined JSON, see "Webhook POST Data" below
  extra: any,

  // Hash of everything above
  digest: string,
}
```

---
## <a id="GeneratingAndSending" class="anchor"></a>Generating and Sending an Invitation

With your backend ready to consume invitation webhooks, the most challenging part is out of the way. The remaining work takes place in the [dashboard](https://app.daisypayments.com), and the rest of the tutorial assumes you have already created and deployed a subscription product so that you may follow along. 

<div class="img-container" style="width: 700px">
  <img src="./img/invitations_tab.png" alt="Where to find your subscription product's id and key in the dashboard" />
</div>

From the [dashboard](https://app.daisypayments.com) landing page, go to a deployed subscription product and click on the **Invitations** tab. Here you can find all active and inactive invitations, with the ability to filter by plan. Click **New Invitation** and define the following: 

<a id="Plan" class="anchor"></a>**Plan**: A deployed subscription product has at least one plan associated with it. Select the plan to which users will be invited to.

<a id="NumberOfUses" class="anchor"></a>**Number of Uses**: An invitation can be set to cease working after a certain number of uses. This can be useful when implementing things like limited quantity promotions. This value can be set after an invitation has already been deployed, but all uses over the lifetime of the invitation will be counted towards the maximum number of uses, not just future ones. By default, an invitation can be used an unlimited number of times.

<a id="ApprovalMethod" class="anchor"></a>**Approval Method**:  By default, Daisy signs all subscriptions that are created with an invitation. If using webhooks and your webhook endpoint returns that same signed subscription agreement, the subscription becomes active and the billing period starts immediately. Alternatively, you can set invitations to require manual approval, meaning the subscription will remain pending [until it is approved](#NoWebhooks) from the invitation's page on the [dashboard](https://app.daisypayments.com).

<a id="WebhookURL" class="anchor"></a>**Webhook URL** (optional, strongly recommended): The URL of your webhook endpoint. 

<a id="WebhookPostData" class="anchor"></a>**Webhook POST Data** (optional): When a completed invitation makes a POST request to your webhook endpoint, you can use this field to include additional data in the `extra` key of the payload. This can be useful for custom validation rules. Any valid JSON is accepted; defaults to an empty object.

Once you click **Create**, the window will display the details of the now-live invitation, including the randomly generated URL that it can be visited at: 

<div class="img-container" style="width: 466px">
  <img src="./img/invitation_url.png" alt="Placeholder for the Invitation URL field in Daisy Dashboard" />
</div>

This link can be shared with your users however you like. It can be emailed out to specific enterprise customers with bespoke plans, it can be displayed within your application to a subset of targeted users, or it could be general-purpose and right on your landing page. Invitations are intentionally flexible to fit many use cases.

---
## <a id="NoWebhooks" class="anchor"></a>Invitations Without Webhooks

If no [Webhook URL](#WebhookURL) is defined for an invitation, the new user is shown a screen stating that their subscription is pending approval and given the opportunity to enter their email address to sign up for email updates. The subscription will remain pending until it is approved from the invitation's page on the [dashboard](https://app.daisypayments.com).

In the near future, you will also be sent an email notification when a user completes an invitation.

---
## <a id="Customization" class="anchor"></a>Customizing Invitations

In your [organization settings](https://app.daisypayments.com), you can customize the background color and font color of your invitations using hex color codes. You can also set your organization logo, which is displayed at the top of your invitations. A gray Daisy logo is used if your organization logo is unset. 

<div class="img-container" style="width: 900px">
  <img src="./img/customized_invites.png" alt="Placeholder for examples of customized invitations" />
</div>

---
## <a id="UserRequirements" class="anchor"></a>What is Required of the User?

A user opens an invitation to your service. There are some prerequisites to signing up for non-fiat denominated subscriptions. What do they need?  The user must:

- Have [MetaMask](https://metamask.io/) installed or be using a dapp browser (for approving tokens and signing the subscription agreement).
- Have enough of one of the subscription's accepted ERC20 tokens to pay for at least one billing period.
- Have enough ETH to pay the gas fee of the approval step (almost always less than $0.10 USD).

If any of these requirements are not met, the invitations page presents actionable error messages to the user. Still, it is highly encouraged to make the user aware of these requirements before they open the invitation.

---

Still have questions after reading this guide? Feel free to contact us at [hello@daisypayments.com](mailto:hello@daisypayments.com).
