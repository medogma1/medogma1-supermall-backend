# استراتيجية التكامل المستمر والنشر المستمر (CI/CD) لمشروع Super Mall Backend

هذا المستند يوضح استراتيجية التكامل المستمر والنشر المستمر (CI/CD) لمشروع Super Mall Backend، ويقدم إرشادات للمطورين حول كيفية المساهمة في سير العمل.

## جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [خط أنابيب CI/CD](#خط-أنابيب-cicd)
  - [التكامل المستمر (CI)](#التكامل-المستمر-ci)
  - [النشر المستمر (CD)](#النشر-المستمر-cd)
- [البيئات](#البيئات)
- [أدوات ومنصات](#أدوات-ومنصات)
- [تكوين خط الأنابيب](#تكوين-خط-الأنابيب)
  - [مثال لتكوين GitHub Actions](#مثال-لتكوين-github-actions)
  - [مثال لتكوين Jenkins](#مثال-لتكوين-jenkins)
- [استراتيجية الفروع والإصدارات](#استراتيجية-الفروع-والإصدارات)
- [الاختبارات](#الاختبارات)
- [النشر](#النشر)
- [المراقبة والتراجع](#المراقبة-والتراجع)
- [أفضل الممارسات](#أفضل-الممارسات)
- [الموارد](#الموارد)

## نظرة عامة

تهدف استراتيجية CI/CD إلى تحقيق الأهداف التالية:

- تسريع دورة التطوير من خلال أتمتة الاختبار والنشر
- تحسين جودة الكود من خلال الاختبارات المستمرة
- تقليل المخاطر المرتبطة بالنشر
- تمكين التسليم المستمر للميزات والإصلاحات

## خط أنابيب CI/CD

### التكامل المستمر (CI)

تتضمن عملية التكامل المستمر الخطوات التالية:

1. **بناء الكود**: تجميع التبعيات وبناء المشروع
2. **التحليل الثابت**: فحص جودة الكود باستخدام ESLint
3. **الاختبارات الوحدة**: تشغيل اختبارات الوحدة باستخدام Jest
4. **اختبارات التكامل**: تشغيل اختبارات التكامل بين الخدمات
5. **فحص الأمان**: فحص التبعيات بحثًا عن الثغرات الأمنية

### النشر المستمر (CD)

تتضمن عملية النشر المستمر الخطوات التالية:

1. **بناء الصور**: إنشاء صور Docker للخدمات
2. **نشر الصور**: دفع الصور إلى سجل الحاويات
3. **نشر البنية التحتية**: تحديث تكوينات Kubernetes أو البنية التحتية الأخرى
4. **النشر**: نشر الخدمات في البيئة المستهدفة
5. **اختبارات ما بعد النشر**: التحقق من صحة النشر

## البيئات

يستخدم المشروع البيئات التالية:

1. **التطوير (Development)**: بيئة المطورين المحلية
2. **الاختبار (Testing)**: بيئة مشتركة للاختبار المستمر
3. **المرحلة (Staging)**: بيئة مماثلة للإنتاج لاختبار النشر
4. **الإنتاج (Production)**: البيئة المباشرة للمستخدمين النهائيين

## أدوات ومنصات

- **نظام التحكم في الإصدارات**: Git (GitHub)
- **خط أنابيب CI/CD**: GitHub Actions أو Jenkins
- **إدارة الحاويات**: Docker و Kubernetes
- **سجل الحاويات**: Docker Hub أو AWS ECR
- **إدارة التكوين**: Kubernetes YAML أو Terraform
- **المراقبة**: Prometheus و Grafana

## تكوين خط الأنابيب

### مثال لتكوين GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm run install:all
      - name: Lint code
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Security scan
        run: npm audit

  build-and-push-images:
    needs: build-and-test
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push API Gateway
        uses: docker/build-push-action@v2
        with:
          context: ./api-gateway
          push: true
          tags: supermall/api-gateway:latest
      # تكرار لكل خدمة

  deploy-staging:
    needs: build-and-push-images
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up kubectl
        uses: azure/setup-kubectl@v1
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/api-gateway

  deploy-production:
    needs: build-and-push-images
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v2
      - name: Set up kubectl
        uses: azure/setup-kubectl@v1
      - name: Set Kubernetes context
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/production/
          kubectl rollout status deployment/api-gateway
```

### مثال لتكوين Jenkins

```groovy
// Jenkinsfile
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
                sh 'npm run install:all'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'npm audit'
            }
        }
        
        stage('Build Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                sh 'docker build -t supermall/api-gateway:latest ./api-gateway'
                // تكرار لكل خدمة
            }
        }
        
        stage('Push Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                withCredentials([string(credentialsId: 'docker-hub-password', variable: 'DOCKER_HUB_PASSWORD')]) {
                    sh 'docker login -u supermall -p ${DOCKER_HUB_PASSWORD}'
                    sh 'docker push supermall/api-gateway:latest'
                    // تكرار لكل خدمة
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                withCredentials([file(credentialsId: 'kube-config-staging', variable: 'KUBECONFIG')]) {
                    sh 'kubectl apply -f k8s/staging/'
                    sh 'kubectl rollout status deployment/api-gateway'
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?'
                withCredentials([file(credentialsId: 'kube-config-production', variable: 'KUBECONFIG')]) {
                    sh 'kubectl apply -f k8s/production/'
                    sh 'kubectl rollout status deployment/api-gateway'
                }
            }
        }
    }
    
    post {
        always {
            junit 'test-results/**/*.xml'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            mail to: 'team@supermall.com',
                 subject: "Failed Pipeline: ${currentBuild.fullDisplayName}",
                 body: "Something is wrong with ${env.BUILD_URL}"
        }
    }
}
```

## استراتيجية الفروع والإصدارات

نستخدم استراتيجية الفروع التالية:

- **main**: فرع الإنتاج، يحتوي على الكود المستقر
- **develop**: فرع التطوير الرئيسي، يتم دمج جميع الميزات فيه
- **feature/***:  فروع الميزات، تُنشأ من `develop` وتُدمج فيه
- **hotfix/***:  فروع الإصلاحات العاجلة، تُنشأ من `main` وتُدمج في `main` و `develop`
- **release/***:  فروع الإصدار، تُنشأ من `develop` وتُدمج في `main` و `develop`

### عملية الإصدار

1. إنشاء فرع `release/vX.Y.Z` من `develop`
2. إجراء أي تصحيحات نهائية في فرع الإصدار
3. دمج فرع الإصدار في `main` و `develop`
4. إنشاء علامة إصدار على `main`

## الاختبارات

### أنواع الاختبارات

- **اختبارات الوحدة**: اختبار الوظائف الفردية
- **اختبارات التكامل**: اختبار التفاعل بين الخدمات
- **اختبارات API**: اختبار واجهات API
- **اختبارات الأداء**: اختبار الأداء تحت الحمل

### متطلبات الاختبار

- يجب أن تكون تغطية الاختبار 70% على الأقل
- يجب أن تنجح جميع الاختبارات قبل الدمج
- يجب إضافة اختبارات جديدة للميزات الجديدة

## النشر

### استراتيجية النشر

- **البيئة المرحلية**: نشر تلقائي من فرع `develop`
- **بيئة الإنتاج**: نشر تلقائي من فرع `main` بعد الموافقة اليدوية

### استراتيجية التحديث

- **التحديثات المتدرجة**: تحديث الخدمات واحدة تلو الأخرى
- **النشر الأزرق/الأخضر**: نشر إصدار جديد بجانب الإصدار القديم ثم التبديل

## المراقبة والتراجع

### المراقبة بعد النشر

- مراقبة معدلات الأخطاء
- مراقبة أوقات الاستجابة
- مراقبة استخدام الموارد

### استراتيجية التراجع

- التراجع التلقائي إذا فشلت اختبارات ما بعد النشر
- التراجع اليدوي إذا تم اكتشاف مشكلات بعد النشر

## أفضل الممارسات

### للمطورين

- اختبار التغييرات محليًا قبل الدفع
- الالتزام بمعايير الكود والاختبار
- تحديث الوثائق مع التغييرات

### لمشرفي النظام

- مراقبة خط الأنابيب بانتظام
- تحديث أسرار وبيانات اعتماد CI/CD بانتظام
- مراجعة وتحسين خط الأنابيب بشكل دوري

## الموارد

### أدوات ومكتبات

- [GitHub Actions](https://github.com/features/actions)
- [Jenkins](https://www.jenkins.io/)
- [Docker](https://www.docker.com/)
- [Kubernetes](https://kubernetes.io/)
- [Jest](https://jestjs.io/)

### ملفات المشروع ذات الصلة

- `.github/workflows/`: تكوينات GitHub Actions
- `Jenkinsfile`: تكوين Jenkins
- `docker-compose.yml`: تكوين Docker Compose
- `k8s/`: تكوينات Kubernetes

---

## الخطوات التالية

- تنفيذ اختبارات الأداء التلقائية
- إضافة تحليل جودة الكود باستخدام SonarQube
- تحسين استراتيجية النشر المتدرج
- تنفيذ مراقبة أفضل بعد النشر