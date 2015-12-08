# pay-demo-service
Example service integration for GOV.UK Pay customer service.

## Running in Development Mode

Steps are as follows:

1. Use a docker-compose environment to run everything (such as databases) that you don't want to develop on right now.
2. Stop `pay-demo-service` in the docker (`docker stop pay-demo-service`), to get ready to run from your checked out copy instead.
3. Because our journeys expect demo-service to be accessible to the browser on dockerhost (not localhost), run the redirect script to send these requests to localhost.
4. Use `env.sh` to pick up the same environment variables from `pay-scripts`, so configuration is set correctly, including telling the service here how to communicate with other services that may be running in docker or on your local machine. (This assumes `$WORKSPACE/pay-scripts` exists)

For example:

```
$ ./redirect.sh start
$ ./env.sh npm start
...
(pay-demo-service log output)
...
(press CTRL+C to stop service)
...
$ ./redirect.sh stop
```

### Required environment variables:

| Name | Description |
| ---- | ----------- |
| PUBLICAPI_URL | URL of the pay-publicapi server. |
| DEMOSERVICE_PAYSTART_URL | publicly reachable URL of this demo-server. Used to create the payment success page URL. |
