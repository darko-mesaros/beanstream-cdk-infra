import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';

export class Beanstram01CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // --- code repo ---
    // AWS CodeCommit
    const repo = new codecommit.Repository(this, 'myRepo', {
      repositoryName: 'beanstreaming-webapp',
      description: 'This is the beanstraming web app - do not touch.',
    });

    // --- pipeline --- 
    const pipeline = new codepipeline.Pipeline(this, 'myPipeline', {
      pipelineName: 'beanstream-webapp-pipeline',
    });

    // --- source stage and stuff ---
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipelineActions.CodeCommitSourceAction({
      actionName: 'CodeCommit-checkout',
      repository: repo,
      branch: 'main',
      output: sourceOutput,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // --- build stage and stuff --- 
    const buildOutput = new codepipeline.Artifact();
    const buildProject = new codebuild.PipelineProject(this, 'myBuildProject');
    const buildAction = new codepipelineActions.CodeBuildAction({
      actionName: 'CodeBuild-Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // --- database ---
    // --- ecs --- 
    // --- dns --- 
    // --- cdn ---
  }
}
