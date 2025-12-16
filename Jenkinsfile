pipeline {
    agent any

    environment {
        APP_NAME = "attendance_app"
        IMAGE_NAME = "attendance_app_image"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'master',
                url: 'https://github.com/Tanvir0922/Attandancesystem.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t $IMAGE_NAME .
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                docker stop $APP_NAME || true
                docker rm $APP_NAME || true
                '''
            }
        }

        stage('Run New Container') {
            steps {
                sh '''
                docker run -d \
                --name $APP_NAME \
                -p 8080:80 \
                $IMAGE_NAME
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful! App running on port 8080"
        }
        failure {
            echo "❌ Deployment Failed"
        }
    }
}

