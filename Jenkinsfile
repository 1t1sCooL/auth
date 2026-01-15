pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = '1t1scool' 
        IMAGE_NAME = 'mongo-auth-service'
        FULL_IMAGE = "${DOCKER_HUB_USER}/${IMAGE_NAME}:${BUILD_NUMBER}"
        LATEST_IMAGE = "${DOCKER_HUB_USER}/${IMAGE_NAME}:latest"
        DOCKER_HUB_CREDS = 'dockerhub'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS}", 
                                 usernameVariable: 'USER', 
                                 passwordVariable: 'PASS')]) {
                    sh """
                        docker build -t ${FULL_IMAGE} -t ${LATEST_IMAGE} .
                        echo \$PASS | docker login -u \$USER --password-stdin
                        docker push ${FULL_IMAGE}
                        docker push ${LATEST_IMAGE}
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    #  Обновляем тег образа в kustomization.yaml на номер сборки
                    cd kubernetes && kustomize edit set image 1t1scool/mongo-auth-service=1t1scool/mongo-auth-service:${BUILD_NUMBER}
                    # Применяем всё сразу
                    kubectl apply -k .
                """
            }
}
    }
}