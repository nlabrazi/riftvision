@Library('nabster-ci') _

pipeline {
    agent any

    stages {
        stage('Notify start') {
            steps {
                notifyTelegram('started')
            }
        }

        stage('CI & Tests') {
            agent {
                docker {
                    image 'mcr.microsoft.com/playwright:v1.65.1-noble'
                    args '--ipc=host'
                    reuseNode true
                }
            }

            stages {
                stage('Install') {
                    steps {
                        npmCi()
                    }
                }

                stage('Check') {
                    steps {
                        sh 'npm run check'
                    }
                }

                stage('Unit tests') {
                    steps {
                        sh 'npm test'
                    }
                }

                stage('Build') {
                    steps {
                        sh 'npm run build'
                    }
                }

                stage('End-to-end tests') {
                    steps {
                        sh 'npm run test:e2e'
                    }
                }
            }
        }

        stage('Docker build & push') {
            steps {
                dockerBuildAndPush(
                    imageName: 'riftvision',
                    target: 'prod'
                )
            }
        }
    }

    post {
        success {
            notifyTelegram('success')
        }

        failure {
            notifyTelegram('failed')
        }
    }
}
