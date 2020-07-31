#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Beanstram01CdkStack } from '../lib/beanstram01-cdk-stack';

const app = new cdk.App();
new Beanstram01CdkStack(app, 'Beanstram01CdkStack');
