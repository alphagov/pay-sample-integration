#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR/..

export PORT=9000
export PUBLICAPI_URL=http://dockerhost:9100
export DEMOSERVICE_PAYSTART_URL=http://demoservice:9000

npm run start
