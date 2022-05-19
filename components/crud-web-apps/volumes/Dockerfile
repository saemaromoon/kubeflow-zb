# --- Build the backend kubeflow-wheel ---
FROM python:3.8 AS backend-kubeflow-wheel

WORKDIR /src

COPY ./common/backend/ .
RUN python3 setup.py bdist_wheel

# --- Build the frontend kubeflow library ---
FROM node:12 as frontend-kubeflow-lib

WORKDIR /src

#RUN npm install -g @angular/cli

ENV NG_CLI_ANALYTICS "ci"
COPY ./common/frontend/kubeflow-common-lib/package.json ./
COPY ./common/frontend/kubeflow-common-lib/package-lock.json ./
RUN npm ci

COPY ./common/frontend/kubeflow-common-lib/projects ./projects
COPY ./common/frontend/kubeflow-common-lib/angular.json .
COPY ./common/frontend/kubeflow-common-lib/tsconfig.json .
RUN npm run build

#WORKDIR /src/dist/kubeflow
#RUN npm link

# --- Build the frontend ---
FROM node:12-buster-slim as frontend

#RUN ng update @angular/core@13 @angular/cli@13
#RUN ng update @angular/material@13
#RUN npm install @angular-devkit/build-angular@12.0.5 --force
#RUN npm install -g @angular/cli@12
RUN npm install webpack
RUN npm link webpack

WORKDIR /src

COPY ./volumes/frontend/package*.json ./
RUN npm install
RUN npm i @angular-devkit/build-angular@12 --force

RUN npm install -g @angular/cli@12

#COPY ./volumes/frontend/package.json ./
#COPY ./volumes/frontend/package-lock.json ./
#COPY ./volumes/frontend/tsconfig.json ./
#COPY ./volumes/frontend/tsconfig.app.json ./
#COPY ./volumes/frontend/tsconfig.spec.json ./
#COPY ./volumes/frontend/angular.json ./
#COPY ./volumes/frontend/src ./src

#ENV NG_CLI_ANALYTICS "ci"
#RUN npm ci

#RUN npm install webpack
#RUN npm link webpack


COPY --from=frontend-kubeflow-lib /src/dist/kubeflow/ ./node_modules/kubeflow/
#COPY ./common/frontend/kubeflow-common-lib/dist/kubeflow/ ./node_modules/kubeflow/

COPY ./volumes/frontend/ .

RUN npm run build -- --output-path=./dist/default --configuration=production
#RUN npm run build -- --output-path=./dist/rok --configuration=rok-prod

# Web App
FROM python:3.7-slim-buster

WORKDIR /package
COPY --from=backend-kubeflow-wheel /src .
RUN pip3 install .

WORKDIR /src
COPY ./volumes/backend/requirements.txt .
RUN pip3 install -r requirements.txt

COPY ./volumes/backend/apps/ ./apps
COPY ./volumes/backend/entrypoint.py .

COPY --from=frontend /src/dist/default/ /src/apps/default/static/
#COPY --from=frontend /src/dist/rok/ /src/apps/rok/static/


ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY 
# AWS 
RUN aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
RUN aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
RUN aws configure set default.region ap-northeast-1

ENTRYPOINT ["/bin/bash","-c","gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app"]
