@Library('nabster-ci') _

pipeline {
    agent any

    stages {
        stage('Notify start') {
            steps {
                notifyTelegram('started')
            }
        }

        stage('Notify Renovate PR') {
            when {
                changeRequest target: 'staging'
            }
            steps {
                notifyRenovatePr()
            }
        }

        stage('CI & Tests') {
            agent {
                docker {
                    image 'mcr.microsoft.com/playwright:v1.63.0-noble'
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

        stage('Docker production build') {
            steps {
                dockerBuildWithPackages(
                    image: 'riftvision:ci',
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
