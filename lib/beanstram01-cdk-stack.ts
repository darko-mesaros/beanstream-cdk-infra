import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';


export class Beanstram01CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    // --- vpc ---
    const myVpc = new ec2.Vpc(this, 'myVpc');

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

    // --- ecs --- 
    // ECR
    const containerRepo = new ecr.Repository(this, 'myECRepo',{
      imageScanOnPush: true,
    });

    // ECS - Cluster
    const cluster = new ecs.Cluster(this, 'webAppCluster', {
      vpc: myVpc,
    });

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'webAppTaskDef');

    const webAppContainer = taskDefinition.addContainer('webAppContainer', {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
    });

    webAppContainer.addPortMappings({
      containerPort: 80,
    });

    // Instantiate an Amazon ECS Service
    const webAppECSService = new ecs.FargateService(this, 'webAppService', {
      cluster,
      taskDefinition,
      desiredCount: 3,
    });

    // --- load balancer ---
    const webLb = new elbv2.ApplicationLoadBalancer(this, 'beanStreamingALB', {
      vpc: myVpc,
      internetFacing: true,
    });

    const webLbListener = webLb.addListener('beanStreamingHTTP',{
      port: 80,
      open: true,
    });

    webLbListener.addTargets('webLbWebAppTargets', {
      targets: [ webAppECSService],
      port: 80,
    });

    // --- database ---
    // --- dns --- 
    // --- cdn ---

    // --- OUTPUTS ---

    new cdk.CfnOutput(this, 'ELB_URL', { value: webLb.loadBalancerDnsName!});
  }
}
