#!/bin/bash
set -e
cd /opt/orion-key/apps/api
mvn -q clean -DskipTests package
systemctl restart orion-key-api.service
