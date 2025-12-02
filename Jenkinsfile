pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Tanvir0922/Attandancesystem.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -t attendance-system .'
                }
            }
        }

        stage('Run Containers') {
            steps {
                script {
                    // Stop old containers
                    sh 'docker compose down || true'

                    // Start new containers
                    sh 'docker compose up -d --build'
                }
            }
        }

        stage('Verify Running Containers') {
            steps {
                script {
                    sh 'docker ps'
                }
            }
        }
    }

    post {
        success {
            echo "Deployment Successful!"
        }
        failure {
            echo "Deployment Failed!"
        }
    }
}
