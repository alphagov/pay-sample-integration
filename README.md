# pay-demo-service
Example service integration for GOV.UK Pay customer service.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/alphagov/pay-demo-service/tree/PP-376)

## Running GOV.UK Pay customer service

npm install
npm start

### Required environment variables:

| Name | Description |
| ---- | ----------- |
| PUBLICAPI_URL | URL of the pay-publicapi server. |
| DEMOSERVICE_PAYSTART_URL | publicly reachable URL of this demo-server. Used to create the payment success page URL. |
