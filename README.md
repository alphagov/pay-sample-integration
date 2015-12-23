# pay-sample-service
Example service integration for GOV.UK Pay customer service.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/alphagov/pay-sample-service/tree/master)

## Running GOV.UK Pay sample service

npm install
npm start

### Required environment variables:

| Name | Example | Description |
| ---- | ------- | ----------- |
| PUBLICAPI_URL | `http://api.pay.service.gov.uk/v1/` | URL of GOV.UK Pay API endpoint. |
| SERVICE_URL | `http://myapp.herokuapp.com/` | Publicly reachable URL of this service. Used to redirect back here after payment.. |
