pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install --legacy-peer-deps'
            }
        }

        stage('Build Angular App') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'aws-ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    powershell '''
                    $keyPath = "$env:WORKSPACE\\jenkins-key.pem"
                    Copy-Item -Path $env:SSH_KEY -Destination $keyPath -Force

                    $Acl = Get-Acl $keyPath
                    $Acl.SetAccessRuleProtection($true, $false)
                    $Rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, "Read", "Allow")
                    $Acl.SetAccessRule($Rule)
                    Set-Acl -Path $keyPath -AclObject $Acl

                    ssh -o StrictHostKeyChecking=no -i $keyPath ${env:SSH_USER}@65.2.37.229 "mkdir -p /tmp/frontend"
                    scp -o StrictHostKeyChecking=no -i $keyPath -pr dist/revconnect-ui/browser/* ${env:SSH_USER}@65.2.37.229:/tmp/frontend/
                    ssh -o StrictHostKeyChecking=no -i $keyPath ${env:SSH_USER}@65.2.37.229 "sudo rm -rf /var/www/html/revconnect-ui/browser/*; sudo mkdir -p /var/www/html/revconnect-ui/browser/; sudo cp -r /tmp/frontend/* /var/www/html/revconnect-ui/browser/; sudo chown -R ec2-user:ec2-user /var/www/html/revconnect-ui; sudo systemctl restart nginx"

                    Remove-Item -Path $keyPath -Force
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Deployment Pipeline Finished.'
        }
    }
}
