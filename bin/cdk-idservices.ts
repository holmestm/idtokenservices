#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkIdservicesStack } from '../lib/cdk-idservices-stack';

const app = new cdk.App();
new CdkIdservicesStack(app, 'CdkIdservicesStack');
