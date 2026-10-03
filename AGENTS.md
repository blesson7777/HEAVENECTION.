# 96. External Communication Integrations

The system may integrate with external communication providers, including:

* IVR providers
* Click-to-call APIs
* SIP/telephony services
* WhatsApp Business messaging APIs
* SMS providers
* Email providers
* Notification providers

External communication providers must be isolated from core business logic.

Do not spread provider-specific HTTP calls throughout controllers, pages, widgets, or unrelated services.

Prefer a clear boundary such as:

```text
Business Feature
       ↓
Communication Service
       ↓
Provider Integration
       ↓
External API
```

For example:

```text
OrderService
    ↓
WhatsAppService
    ↓
WhatsAppProvider
```

or:

```text
LeadService
    ↓
CallService
    ↓
IVRProvider
```

The exact number of layers should remain proportional to project complexity.

Do not introduce unnecessary provider abstractions when only one simple integration exists.

---

# 97. Communication Module Organization

For substantial communication functionality, prefer dedicated modules.

Example NestJS structure:

```text
modules/
├── communications/
│   ├── whatsapp/
│   │   ├── whatsapp.service.ts
│   │   ├── whatsapp.controller.ts
│   │   ├── whatsapp-webhook.controller.ts
│   │   ├── whatsapp.provider.ts
│   │   ├── dto/
│   │   └── types/
│   │
│   ├── ivr/
│   │   ├── ivr.service.ts
│   │   ├── ivr.controller.ts
│   │   ├── ivr-webhook.controller.ts
│   │   ├── ivr.provider.ts
│   │   ├── dto/
│   │   └── types/
│   │
│   └── communications.module.ts
```

Do not create this entire structure for a tiny integration.

Create files according to actual responsibility.

---

# 98. Provider-Specific Code

Keep provider-specific implementation isolated.

Business code should preferably express intent:

```typescript
await whatsappService.sendOrderConfirmation(order);
```

rather than directly constructing provider HTTP requests throughout the application.

Avoid:

```typescript
await axios.post(
  'https://provider.example/messages',
  providerSpecificPayload,
);
```

inside:

* order services
* product services
* user services
* controllers
* Next.js components
* Flutter widgets

Provider APIs may change independently from business logic.

---

# 99. Backend-Only Provider Communication

Sensitive IVR and WhatsApp provider APIs must normally be called from the backend.

Preferred:

```text
Next.js ──────┐
              │
              ▼
           NestJS
              │
       ┌──────┴───────┐
       ▼              ▼
   WhatsApp          IVR
     API              API

Flutter ──────► NestJS
```

Avoid:

```text
Flutter → IVR Provider

Flutter → WhatsApp Provider
```

when doing so requires private credentials.

Avoid exposing provider credentials to browser-side Next.js code.

Provider secrets belong on trusted backend infrastructure.

---

# 100. Provider Credentials

Never hardcode:

* WhatsApp access tokens
* IVR API keys
* SIP credentials
* webhook secrets
* account IDs containing sensitive credentials
* provider passwords
* signing secrets

Use environment variables or an approved secret manager.

Example:

```text
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_SECRET=

IVR_API_URL=
IVR_API_KEY=
IVR_SERVICE_NUMBER=
```

Real values must never be committed to Git.

---

# 101. Do Not Log Communication Credentials

Never log:

```text
Authorization headers
WhatsApp access tokens
IVR API keys
SIP passwords
Webhook secrets
Bearer tokens
```

Redact sensitive provider data before logging requests/errors.

---

# 102. Product Messaging Automation

Product-related WhatsApp automation should be modeled as business workflows rather than scattered message-sending calls.

Example:

```text
Product Event
      ↓
Determine whether communication is required
      ↓
Check recipient eligibility/consent and business rules
      ↓
Select approved template/content
      ↓
Create message job
      ↓
Send through WhatsApp provider
      ↓
Store provider message ID
      ↓
Process delivery webhook
      ↓
Update final status
```

Do not tightly couple product creation/update logic to slow external messaging requests when asynchronous delivery is more appropriate.

---

# 103. Message Templates

Do not hardcode large WhatsApp message bodies throughout services.

Use a controlled template system.

A message template should have a stable identifier.

Example:

```text
product_available
order_confirmed
payment_received
delivery_update
appointment_reminder
follow_up
```

Keep template variables explicit.

Example:

```text
template: product_available

variables:
- customerName
- productName
- productPrice
- productUrl
```

Validate required variables before sending.

When a provider requires pre-approved templates, preserve the provider template identifier and language information explicitly.

---

# 104. Messaging Consent and Preferences

Do not assume that possession of a phone number automatically means every automated message should be sent.

Store and enforce applicable messaging preferences, consent/opt-in state, opt-out state, and communication rules according to the provider requirements and applicable business/legal requirements.

Never intentionally bypass provider anti-spam controls.

Marketing/product automation must respect opt-out state.

Transactional and marketing communications should be distinguishable when the provider or applicable rules require different handling.

---

# 105. Communication Audit Records

Important automated communications should be traceable.

Where appropriate, maintain records containing fields such as:

```text
id
channel
recipient
template
relatedEntityType
relatedEntityId
providerMessageId
status
attemptCount
createdAt
sentAt
deliveredAt
failedAt
failureCode
```

Do not store sensitive payload data unnecessarily.

This should allow developers to answer:

```text
Was the message created?
Was it submitted?
Which provider ID was returned?
Was it delivered?
Did it fail?
Why did it fail?
Was it retried?
```

---

# 106. Communication Status

Use clear internal statuses.

Example:

```text
PENDING
PROCESSING
SENT
DELIVERED
READ
FAILED
CANCELLED
```

Do not assume an HTTP `200` response means a WhatsApp message was delivered.

Distinguish:

```text
API accepted message
        ≠
message delivered
        ≠
message read
```

Use provider webhooks for final status where supported.

---

# 107. Webhook Architecture

WhatsApp and IVR providers may send asynchronous callbacks.

Use dedicated webhook endpoints.

Example:

```text
POST /api/v1/webhooks/whatsapp
POST /api/v1/webhooks/ivr
```

Do not mix provider webhook processing with normal user-facing controllers unnecessarily.

---

# 108. Webhook Security

Treat webhook requests as untrusted until verified.

When supported by the provider:

* verify signatures
* verify tokens/secrets
* validate payload structure
* reject invalid requests
* use HTTPS
* validate expected event types

Never trust a webhook merely because it contains a known provider ID.

Follow the specific provider's documented verification mechanism.

---

# 109. Webhook Idempotency

Providers may send the same webhook multiple times.

Webhook processing MUST tolerate duplicates.

Prefer:

```text
Receive webhook
      ↓
Verify authenticity
      ↓
Identify provider event/message ID
      ↓
Check whether already processed
      ↓
Process only when necessary
      ↓
Persist status
```

Never assume webhooks are delivered exactly once.

---

# 110. Webhook Response Time

Webhook endpoints should respond quickly.

Do not perform unnecessary expensive operations before acknowledging a valid webhook.

When processing is substantial:

```text
Webhook
   ↓
Validate
   ↓
Persist/enqueue
   ↓
Respond
   ↓
Background processing
```

---

# 111. Retry Policy

External APIs can fail temporarily.

Retries may be appropriate for:

```text
timeouts
temporary network failures
provider 5xx failures
some provider rate-limit responses
```

Do not blindly retry every error.

Do not retry permanent failures such as an invalid recipient indefinitely.

Use controlled retry behavior.

Example concept:

```text
attempt 1
   ↓
short delay
   ↓
attempt 2
   ↓
longer delay
   ↓
attempt 3
   ↓
FAILED
```

Use exponential backoff/jitter when appropriate.

Set a maximum attempt count.

---

# 112. Duplicate Prevention

Messaging and calling operations can create real-world side effects.

Never allow uncontrolled retries to produce:

```text
5 identical WhatsApp messages
10 duplicate calls
multiple customer notifications
```

Use idempotency/deduplication where appropriate.

A business event should have a stable identifier that can be used to determine whether its communication has already been scheduled or sent.

---

# 113. Background Processing

Large communication automation should normally use background processing.

Example:

```text
Product becomes available
        ↓
Create communication jobs
        ↓
Return/continue business request
        ↓
Worker processes jobs
        ↓
WhatsApp API
```

Do not send thousands of messages synchronously from a single HTTP request.

For very small systems, do not introduce queue infrastructure before it is needed.

Design the communication service so background processing can be introduced cleanly when volume requires it.

---

# 114. Rate Limits

Respect provider rate limits.

Do not attempt to bypass provider restrictions.

When processing bulk communication:

```text
Queue
 ↓
Controlled worker
 ↓
Rate limit
 ↓
Provider
```

Handle `429` responses appropriately.

Do not immediately retry hundreds of rate-limited requests.

---

# 115. IVR / Click-to-Call Architecture

IVR/click-to-call operations should be initiated through the backend.

Example:

```text
Flutter Staff App
       ↓
POST /api/v1/calls
       ↓
NestJS
       ↓
Authorization
       ↓
Call Service
       ↓
IVR Provider
       ↓
Agent + Customer
```

The mobile app should not need the provider's private credentials.

---

# 116. Call Authorization

Before initiating a call, verify:

* authenticated staff identity
* permission to call
* access to the lead/customer
* valid destination
* relevant business restrictions

Never trust the Flutter application to supply an unrestricted agent identity.

Determine sensitive identity/permission information server-side whenever possible.

---

# 117. Call Records

Where appropriate, store call metadata such as:

```text
id
providerCallId
staffId
customerId / leadId
destination
status
startedAt
answeredAt
endedAt
duration
providerStatus
createdAt
```

Do not store call recordings unless explicitly required and appropriate consent, security, retention, and provider requirements have been addressed.

---

# 118. IVR Webhooks

Use provider callbacks/CDRs to update actual call state.

Possible internal statuses:

```text
REQUESTED
INITIATED
RINGING
ANSWERED
COMPLETED
BUSY
NO_ANSWER
FAILED
CANCELLED
```

Do not assume a successful call initiation API response means the customer answered.

---

# 119. Provider Error Translation

Do not expose raw provider errors directly to users.

Translate provider failures into stable internal errors.

Example:

```text
Provider:
ERR_DEST_1938

Internal:
INVALID_DESTINATION
```

Keep the provider error/code in internal logs or appropriate audit records for debugging.

This prevents UI code from becoming dependent on one provider's error format.

---

# 120. Provider Timeouts

Every external provider request must have a reasonable timeout.

Never allow external API requests to hang indefinitely.

Timeout values should be configurable where appropriate.

---

# 121. Provider Availability

Do not assume WhatsApp or IVR providers are always available.

Design important workflows so temporary communication failure does not unnecessarily corrupt the underlying business transaction.

For example:

```text
Order successfully created
       ↓
Notification queued
       ↓
WhatsApp temporarily unavailable
       ↓
Order remains valid
       ↓
Notification retried
```

Do not roll back an otherwise valid business transaction solely because a non-critical notification provider is temporarily unavailable.

Critical workflows may require different handling.

---

# 122. Communication Observability

Production communication integrations should expose enough information to diagnose:

```text
message failure rate
call initiation failure rate
provider latency
queue backlog
retry count
webhook processing failures
rate limiting
```

Do not add complex monitoring infrastructure before it is needed, but keep the architecture observable.

---

# 123. Phone Number Handling

Use a consistent normalized phone-number format.

Prefer an international format such as E.164 when supported by the provider.

Do not maintain multiple inconsistent representations such as:

```text
9876543210
+919876543210
919876543210
09876543210
```

throughout the database without a defined reason.

Separate display formatting from canonical storage when appropriate.

---

# 124. Sensitive Customer Information

Phone numbers and communication history are potentially sensitive information.

Apply:

* authorization
* appropriate access controls
* minimal logging
* secure storage
* reasonable retention

Do not expose complete communication history to users who do not require access.

---

# 125. Product Automation Rules

Never place automation logic directly inside UI components.

Bad:

```text
ProductPage.tsx
   ↓
direct WhatsApp API
```

or:

```text
product_page.dart
   ↓
direct WhatsApp API
```

Preferred:

```text
Next.js / Flutter
       ↓
NestJS
       ↓
Product/Application Service
       ↓
Communication workflow
       ↓
Queue/Communication Service
       ↓
WhatsApp Provider
```

---

# 126. Automation Rules Must Be Explicit

Product automation should define:

```text
Trigger
Audience
Eligibility
Template
Variables
Channel
Deduplication rule
Retry policy
Failure behavior
```

Example:

```text
Trigger:
Product stock becomes available

Audience:
Customers subscribed to the product

Eligibility:
WhatsApp opt-in is active

Template:
product_available

Deduplication:
One notification per customer/product/restock event

Retry:
Temporary failures only

Failure:
Record failure without rolling back product inventory
```

Do not implement vague automation that can repeatedly contact customers without a clear trigger and deduplication rule.

---

# 127. Bulk Messaging Safety

Before bulk product messaging:

1. determine the target audience
2. apply consent/preferences
3. remove invalid recipients
4. deduplicate recipients
5. create jobs
6. process at controlled throughput
7. record results
8. process delivery webhooks

Never iterate through thousands of customers and directly call the provider synchronously from a controller.

---

# 128. Development and Testing

Do not accidentally send real:

* WhatsApp messages
* IVR calls
* SMS messages

during automated tests.

Provider clients should support safe testing/mocking.

Development and production credentials must be separated.

Clearly distinguish test/sandbox behavior from production behavior.

---

# 129. Communication Testing

Test important cases including:

* successful message submission
* successful call initiation
* invalid recipient
* provider timeout
* provider 5xx response
* provider 429 response
* duplicate webhook
* invalid webhook signature
* delivery failure
* retry exhaustion
* duplicate automation event
* unauthorized call initiation
* opted-out marketing recipient

Tests should verify business behavior rather than merely mocking every internal function.

---

# 130. Communication Provider Replacement

Do not tightly couple the entire application to provider-specific response formats.

Keep provider-specific translation near the integration boundary.

The application should use internal concepts such as:

```text
sendMessage()
initiateCall()
messageId
callId
deliveryStatus
callStatus
```

rather than leaking provider-specific structures everywhere.

However, do not build an elaborate multi-provider framework unless multiple providers or provider replacement is a realistic requirement.

---

# 131. Communication Final Review

Before completing IVR or WhatsApp-related work, verify:

### Security

* Are provider credentials backend-only?
* Are webhook signatures/tokens verified?
* Are permissions checked?
* Are sensitive values excluded from logs?

### Reliability

* Are timeouts configured?
* Are retries controlled?
* Are operations idempotent where necessary?
* Can duplicate webhooks be handled?
* Can duplicate messages/calls occur?

### Messaging

* Is recipient eligibility checked?
* Are messaging preferences/opt-outs respected?
* Is the correct template used?
* Is bulk processing controlled?

### IVR

* Is staff authorization checked?
* Is the destination validated?
* Is actual call status obtained from the provider?
* Are call records traceable?

### Architecture

* Is provider-specific code isolated?
* Is external API code kept out of Flutter/React UI?
* Is business logic independent of provider payload formats?
* Was unnecessary abstraction avoided?

### Debugging

* Can a failed message/call be traced?
* Is the provider ID stored where appropriate?
* Is the failure reason available internally?
* Can operations be correlated with application records?

---

# 132. Communication Principle

External communication is not a guaranteed synchronous operation.

Always design with the assumption that:

> requests can timeout

> providers can be unavailable

> webhooks can arrive late

> webhooks can arrive more than once

> delivery can fail after initial acceptance

> clients can retry requests

> workers can restart

> rate limits can occur

Therefore communication workflows should be secure, traceable, retry-safe, and duplicate-safe without unnecessarily complicating the rest of the application.
# 96. External Communication Integrations

The system may integrate with external communication providers, including:

* IVR providers
* Click-to-call APIs
* SIP/telephony services
* WhatsApp Business messaging APIs
* SMS providers
* Email providers
* Notification providers

External communication providers must be isolated from core business logic.

Do not spread provider-specific HTTP calls throughout controllers, pages, widgets, or unrelated services.

Prefer a clear boundary such as:

```text
Business Feature
       ↓
Communication Service
       ↓
Provider Integration
       ↓
External API
```

For example:

```text
OrderService
    ↓
WhatsAppService
    ↓
WhatsAppProvider
```

or:

```text
LeadService
    ↓
CallService
    ↓
IVRProvider
```

The exact number of layers should remain proportional to project complexity.

Do not introduce unnecessary provider abstractions when only one simple integration exists.

---

# 97. Communication Module Organization

For substantial communication functionality, prefer dedicated modules.

Example NestJS structure:

```text
modules/
├── communications/
│   ├── whatsapp/
│   │   ├── whatsapp.service.ts
│   │   ├── whatsapp.controller.ts
│   │   ├── whatsapp-webhook.controller.ts
│   │   ├── whatsapp.provider.ts
│   │   ├── dto/
│   │   └── types/
│   │
│   ├── ivr/
│   │   ├── ivr.service.ts
│   │   ├── ivr.controller.ts
│   │   ├── ivr-webhook.controller.ts
│   │   ├── ivr.provider.ts
│   │   ├── dto/
│   │   └── types/
│   │
│   └── communications.module.ts
```

Do not create this entire structure for a tiny integration.

Create files according to actual responsibility.

---

# 98. Provider-Specific Code

Keep provider-specific implementation isolated.

Business code should preferably express intent:

```typescript
await whatsappService.sendOrderConfirmation(order);
```

rather than directly constructing provider HTTP requests throughout the application.

Avoid:

```typescript
await axios.post(
  'https://provider.example/messages',
  providerSpecificPayload,
);
```

inside:

* order services
* product services
* user services
* controllers
* Next.js components
* Flutter widgets

Provider APIs may change independently from business logic.

---

# 99. Backend-Only Provider Communication

Sensitive IVR and WhatsApp provider APIs must normally be called from the backend.

Preferred:

```text
Next.js ──────┐
              │
              ▼
           NestJS
              │
       ┌──────┴───────┐
       ▼              ▼
   WhatsApp          IVR
     API              API

Flutter ──────► NestJS
```

Avoid:

```text
Flutter → IVR Provider

Flutter → WhatsApp Provider
```

when doing so requires private credentials.

Avoid exposing provider credentials to browser-side Next.js code.

Provider secrets belong on trusted backend infrastructure.

---

# 100. Provider Credentials

Never hardcode:

* WhatsApp access tokens
* IVR API keys
* SIP credentials
* webhook secrets
* account IDs containing sensitive credentials
* provider passwords
* signing secrets

Use environment variables or an approved secret manager.

Example:

```text
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_SECRET=

IVR_API_URL=
IVR_API_KEY=
IVR_SERVICE_NUMBER=
```

Real values must never be committed to Git.

---

# 101. Do Not Log Communication Credentials

Never log:

```text
Authorization headers
WhatsApp access tokens
IVR API keys
SIP passwords
Webhook secrets
Bearer tokens
```

Redact sensitive provider data before logging requests/errors.

---

# 102. Product Messaging Automation

Product-related WhatsApp automation should be modeled as business workflows rather than scattered message-sending calls.

Example:

```text
Product Event
      ↓
Determine whether communication is required
      ↓
Check recipient eligibility/consent and business rules
      ↓
Select approved template/content
      ↓
Create message job
      ↓
Send through WhatsApp provider
      ↓
Store provider message ID
      ↓
Process delivery webhook
      ↓
Update final status
```

Do not tightly couple product creation/update logic to slow external messaging requests when asynchronous delivery is more appropriate.

---

# 103. Message Templates

Do not hardcode large WhatsApp message bodies throughout services.

Use a controlled template system.

A message template should have a stable identifier.

Example:

```text
product_available
order_confirmed
payment_received
delivery_update
appointment_reminder
follow_up
```

Keep template variables explicit.

Example:

```text
template: product_available

variables:
- customerName
- productName
- productPrice
- productUrl
```

Validate required variables before sending.

When a provider requires pre-approved templates, preserve the provider template identifier and language information explicitly.

---

# 104. Messaging Consent and Preferences

Do not assume that possession of a phone number automatically means every automated message should be sent.

Store and enforce applicable messaging preferences, consent/opt-in state, opt-out state, and communication rules according to the provider requirements and applicable business/legal requirements.

Never intentionally bypass provider anti-spam controls.

Marketing/product automation must respect opt-out state.

Transactional and marketing communications should be distinguishable when the provider or applicable rules require different handling.

---

# 105. Communication Audit Records

Important automated communications should be traceable.

Where appropriate, maintain records containing fields such as:

```text
id
channel
recipient
template
relatedEntityType
relatedEntityId
providerMessageId
status
attemptCount
createdAt
sentAt
deliveredAt
failedAt
failureCode
```

Do not store sensitive payload data unnecessarily.

This should allow developers to answer:

```text
Was the message created?
Was it submitted?
Which provider ID was returned?
Was it delivered?
Did it fail?
Why did it fail?
Was it retried?
```

---

# 106. Communication Status

Use clear internal statuses.

Example:

```text
PENDING
PROCESSING
SENT
DELIVERED
READ
FAILED
CANCELLED
```

Do not assume an HTTP `200` response means a WhatsApp message was delivered.

Distinguish:

```text
API accepted message
        ≠
message delivered
        ≠
message read
```

Use provider webhooks for final status where supported.

---

# 107. Webhook Architecture

WhatsApp and IVR providers may send asynchronous callbacks.

Use dedicated webhook endpoints.

Example:

```text
POST /api/v1/webhooks/whatsapp
POST /api/v1/webhooks/ivr
```

Do not mix provider webhook processing with normal user-facing controllers unnecessarily.

---

# 108. Webhook Security

Treat webhook requests as untrusted until verified.

When supported by the provider:

* verify signatures
* verify tokens/secrets
* validate payload structure
* reject invalid requests
* use HTTPS
* validate expected event types

Never trust a webhook merely because it contains a known provider ID.

Follow the specific provider's documented verification mechanism.

---

# 109. Webhook Idempotency

Providers may send the same webhook multiple times.

Webhook processing MUST tolerate duplicates.

Prefer:

```text
Receive webhook
      ↓
Verify authenticity
      ↓
Identify provider event/message ID
      ↓
Check whether already processed
      ↓
Process only when necessary
      ↓
Persist status
```

Never assume webhooks are delivered exactly once.

---

# 110. Webhook Response Time

Webhook endpoints should respond quickly.

Do not perform unnecessary expensive operations before acknowledging a valid webhook.

When processing is substantial:

```text
Webhook
   ↓
Validate
   ↓
Persist/enqueue
   ↓
Respond
   ↓
Background processing
```

---

# 111. Retry Policy

External APIs can fail temporarily.

Retries may be appropriate for:

```text
timeouts
temporary network failures
provider 5xx failures
some provider rate-limit responses
```

Do not blindly retry every error.

Do not retry permanent failures such as an invalid recipient indefinitely.

Use controlled retry behavior.

Example concept:

```text
attempt 1
   ↓
short delay
   ↓
attempt 2
   ↓
longer delay
   ↓
attempt 3
   ↓
FAILED
```

Use exponential backoff/jitter when appropriate.

Set a maximum attempt count.

---

# 112. Duplicate Prevention

Messaging and calling operations can create real-world side effects.

Never allow uncontrolled retries to produce:

```text
5 identical WhatsApp messages
10 duplicate calls
multiple customer notifications
```

Use idempotency/deduplication where appropriate.

A business event should have a stable identifier that can be used to determine whether its communication has already been scheduled or sent.

---

# 113. Background Processing

Large communication automation should normally use background processing.

Example:

```text
Product becomes available
        ↓
Create communication jobs
        ↓
Return/continue business request
        ↓
Worker processes jobs
        ↓
WhatsApp API
```

Do not send thousands of messages synchronously from a single HTTP request.

For very small systems, do not introduce queue infrastructure before it is needed.

Design the communication service so background processing can be introduced cleanly when volume requires it.

---

# 114. Rate Limits

Respect provider rate limits.

Do not attempt to bypass provider restrictions.

When processing bulk communication:

```text
Queue
 ↓
Controlled worker
 ↓
Rate limit
 ↓
Provider
```

Handle `429` responses appropriately.

Do not immediately retry hundreds of rate-limited requests.

---

# 115. IVR / Click-to-Call Architecture

IVR/click-to-call operations should be initiated through the backend.

Example:

```text
Flutter Staff App
       ↓
POST /api/v1/calls
       ↓
NestJS
       ↓
Authorization
       ↓
Call Service
       ↓
IVR Provider
       ↓
Agent + Customer
```

The mobile app should not need the provider's private credentials.

---

# 116. Call Authorization

Before initiating a call, verify:

* authenticated staff identity
* permission to call
* access to the lead/customer
* valid destination
* relevant business restrictions

Never trust the Flutter application to supply an unrestricted agent identity.

Determine sensitive identity/permission information server-side whenever possible.

---

# 117. Call Records

Where appropriate, store call metadata such as:

```text
id
providerCallId
staffId
customerId / leadId
destination
status
startedAt
answeredAt
endedAt
duration
providerStatus
createdAt
```

Do not store call recordings unless explicitly required and appropriate consent, security, retention, and provider requirements have been addressed.

---

# 118. IVR Webhooks

Use provider callbacks/CDRs to update actual call state.

Possible internal statuses:

```text
REQUESTED
INITIATED
RINGING
ANSWERED
COMPLETED
BUSY
NO_ANSWER
FAILED
CANCELLED
```

Do not assume a successful call initiation API response means the customer answered.

---

# 119. Provider Error Translation

Do not expose raw provider errors directly to users.

Translate provider failures into stable internal errors.

Example:

```text
Provider:
ERR_DEST_1938

Internal:
INVALID_DESTINATION
```

Keep the provider error/code in internal logs or appropriate audit records for debugging.

This prevents UI code from becoming dependent on one provider's error format.

---

# 120. Provider Timeouts

Every external provider request must have a reasonable timeout.

Never allow external API requests to hang indefinitely.

Timeout values should be configurable where appropriate.

---

# 121. Provider Availability

Do not assume WhatsApp or IVR providers are always available.

Design important workflows so temporary communication failure does not unnecessarily corrupt the underlying business transaction.

For example:

```text
Order successfully created
       ↓
Notification queued
       ↓
WhatsApp temporarily unavailable
       ↓
Order remains valid
       ↓
Notification retried
```

Do not roll back an otherwise valid business transaction solely because a non-critical notification provider is temporarily unavailable.

Critical workflows may require different handling.

---

# 122. Communication Observability

Production communication integrations should expose enough information to diagnose:

```text
message failure rate
call initiation failure rate
provider latency
queue backlog
retry count
webhook processing failures
rate limiting
```

Do not add complex monitoring infrastructure before it is needed, but keep the architecture observable.

---

# 123. Phone Number Handling

Use a consistent normalized phone-number format.

Prefer an international format such as E.164 when supported by the provider.

Do not maintain multiple inconsistent representations such as:

```text
9876543210
+919876543210
919876543210
09876543210
```

throughout the database without a defined reason.

Separate display formatting from canonical storage when appropriate.

---

# 124. Sensitive Customer Information

Phone numbers and communication history are potentially sensitive information.

Apply:

* authorization
* appropriate access controls
* minimal logging
* secure storage
* reasonable retention

Do not expose complete communication history to users who do not require access.

---

# 125. Product Automation Rules

Never place automation logic directly inside UI components.

Bad:

```text
ProductPage.tsx
   ↓
direct WhatsApp API
```

or:

```text
product_page.dart
   ↓
direct WhatsApp API
```

Preferred:

```text
Next.js / Flutter
       ↓
NestJS
       ↓
Product/Application Service
       ↓
Communication workflow
       ↓
Queue/Communication Service
       ↓
WhatsApp Provider
```

---

# 126. Automation Rules Must Be Explicit

Product automation should define:

```text
Trigger
Audience
Eligibility
Template
Variables
Channel
Deduplication rule
Retry policy
Failure behavior
```

Example:

```text
Trigger:
Product stock becomes available

Audience:
Customers subscribed to the product

Eligibility:
WhatsApp opt-in is active

Template:
product_available

Deduplication:
One notification per customer/product/restock event

Retry:
Temporary failures only

Failure:
Record failure without rolling back product inventory
```

Do not implement vague automation that can repeatedly contact customers without a clear trigger and deduplication rule.

---

# 127. Bulk Messaging Safety

Before bulk product messaging:

1. determine the target audience
2. apply consent/preferences
3. remove invalid recipients
4. deduplicate recipients
5. create jobs
6. process at controlled throughput
7. record results
8. process delivery webhooks

Never iterate through thousands of customers and directly call the provider synchronously from a controller.

---

# 128. Development and Testing

Do not accidentally send real:

* WhatsApp messages
* IVR calls
* SMS messages

during automated tests.

Provider clients should support safe testing/mocking.

Development and production credentials must be separated.

Clearly distinguish test/sandbox behavior from production behavior.

---

# 129. Communication Testing

Test important cases including:

* successful message submission
* successful call initiation
* invalid recipient
* provider timeout
* provider 5xx response
* provider 429 response
* duplicate webhook
* invalid webhook signature
* delivery failure
* retry exhaustion
* duplicate automation event
* unauthorized call initiation
* opted-out marketing recipient

Tests should verify business behavior rather than merely mocking every internal function.

---

# 130. Communication Provider Replacement

Do not tightly couple the entire application to provider-specific response formats.

Keep provider-specific translation near the integration boundary.

The application should use internal concepts such as:

```text
sendMessage()
initiateCall()
messageId
callId
deliveryStatus
callStatus
```

rather than leaking provider-specific structures everywhere.

However, do not build an elaborate multi-provider framework unless multiple providers or provider replacement is a realistic requirement.

---

# 131. Communication Final Review

Before completing IVR or WhatsApp-related work, verify:

### Security

* Are provider credentials backend-only?
* Are webhook signatures/tokens verified?
* Are permissions checked?
* Are sensitive values excluded from logs?

### Reliability

* Are timeouts configured?
* Are retries controlled?
* Are operations idempotent where necessary?
* Can duplicate webhooks be handled?
* Can duplicate messages/calls occur?

### Messaging

* Is recipient eligibility checked?
* Are messaging preferences/opt-outs respected?
* Is the correct template used?
* Is bulk processing controlled?

### IVR

* Is staff authorization checked?
* Is the destination validated?
* Is actual call status obtained from the provider?
* Are call records traceable?

### Architecture

* Is provider-specific code isolated?
* Is external API code kept out of Flutter/React UI?
* Is business logic independent of provider payload formats?
* Was unnecessary abstraction avoided?

### Debugging

* Can a failed message/call be traced?
* Is the provider ID stored where appropriate?
* Is the failure reason available internally?
* Can operations be correlated with application records?

---

# 132. Communication Principle

External communication is not a guaranteed synchronous operation.

Always design with the assumption that:

> requests can timeout

> providers can be unavailable

> webhooks can arrive late

> webhooks can arrive more than once

> delivery can fail after initial acceptance

> clients can retry requests

> workers can restart

> rate limits can occur

Therefore communication workflows should be secure, traceable, retry-safe, and duplicate-safe without unnecessarily complicating the rest of the application.
