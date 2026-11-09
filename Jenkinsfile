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
          image 'mcr.microsoft.com/playwright:v1.63.0-noble'
          args '--ipc=host'
          reuseNode true
        }
      }
      stages {
        stage('Install') {
          steps {
            withCredentials([
            string(
                credentialsId: 'github-packages-read',
                variable: 'GITHUB_TOKEN'
            )
        ]) {
              sh '''
                set +x
                set -eu
                umask 077

                NPMRC="$(mktemp)"
                trap 'rm -f "$NPMRC"' EXIT

                printf '%s\\n' \
                    '@nlabrazi:registry=https://npm.pkg.github.com' \
                    "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" \
                    > "$NPMRC"

                NPM_CONFIG_USERCONFIG="$NPMRC" npm ci
            '''
            }
          }
        }

        stage('Lint') {
          steps {
            sh 'npm run lint'
          }
        }

        stage('Format check') {
          steps {
            sh 'npm run format:check'
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
            sh 'npm run e2e'
          }
        }
      }
        }

        stage('Docker production build') {
      steps {
        sh 'docker build --target prod -t riftvision:ci .'
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
