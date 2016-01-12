# pay-sample-integration
Example service integration for GOV.UK Pay customer service.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Running GOV.UK Pay sample service
```
npm install
npm start
```

### Required environment variables:

| Name | Example | Description |
| ---- | ------- | ----------- |
| PAY_API_URL | `https://api.pay.service.gov.uk/` | URL of GOV.UK Pay API endpoint. |
| SERVICE_URL | `https://myapp.herokuapp.com/` | Publicly reachable URL of this service. Used to redirect back here after payment.. |
