# Fly debug

The purpose of this repo is to attempt to reproduce a `broken pipe` issue that
consistently occurs when deploying Inngest functions on fly.io.

There seems to be an implicit 200kb request body limit, and whenever that's exceeded,
either the TCP connection go reset or fly's network terminated the connection, resulting
in Go's `broken pipe` error on attempting a POST request.

The test function simply just returns a ~30kb response on each step.
As the step accumulates, the state that Inngest's executor passes to the running function
will eventually exceed 200kb, and that's when the function will fail.

## Pre-requisites

* [Inngest](https://www.inngest.com/) account
* [Fly](https://fly.io/) account

## Setup

### Create account on Inngest

If an account doesn't exist yet, create one at https://app.inngest.com/sign-up .

### Find event key and signing key

In page https://app.inngest.com/env/production/manage/keys, there should be a default
signing key available, and you should be able to see the siging key under the `Signing Key` tab.

Save this as it will need to be set later as secrets

### Deploy repo to Fly

There's a `fly.toml` file for the configuration already.

Run `fly launch` to create the new app, and then `fly deploy` to deploy the app to fly.io.

### Setting secrets

Set the event key and signing key as secrets for the newly deployed app.

```
fly secrets set INNGEST_EVENT_KEY='<event key>' INNGEST_SIGNING_KEY='<signing key>'
```

### Register deployed app on Inngest

Visit the `/api/inngest` endpoint on the browser of the newly deployed app. If you see the following JSON response, it means that it's setup correctly.

```json
{"message":"Inngest endpoint configured correctly.","hasEventKey":true,"hasSigningKey":true,"functionsFound":2}
```

Now go to the [Deploy](https://app.inngest.com/env/production/deploys) page on Inngest, and click on the `Deploy button`.

Add the app url `<app-url>/api/inngest` to the form and submit. Reloading the page should show that the app has been registered.

You should also be able to see the function in the [function list page](https://app.inngest.com/env/production/functions).

### Trigger the function

A function can be triggered from the [Event](https://app.inngest.com/env/production/events) page.
Click on `Send Event`, and set the name to `test/multi-step`, and then submit by clicking the `Send Event` button on the modal.

Go to the [function list page](https://app.inngest.com/env/production/functions) and you should see the function started executing.

Wait for about a minute of so and you should see the function run is marked as failed, and the last step has the `broken pipe` error.

Since the response from each step is ~30kb, the function should fail on the 6th step, and won't be able to finish all of them.


#### NOTE

There's a 10s sleep happening on each step because the initial suspicion was that fly was closing the connection at 60s mark, regardless of
having data transimitted or not. I've verified that that's not the case, but just didn't remove the timer.
