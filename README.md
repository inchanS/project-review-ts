# project-review
## 프로젝트 소개
- 프로젝트명 : project-review
- 프로젝트 설명 : 상품이나 서비스 등에 대한 리뷰를 게시할 수 있는 웹사이트 개발
- 개발 기간 : 2023.01 ~ 2023.03 (약 2개월)
- 개발 인원 : Team **Minhee-project** (2명)
  - **Back-end** : 1명 ([inchanS (Song Inchan)](https://github.com/inchanS))
  - Front-end : 1명 ([DawonOh](https://github.com/DawonOh))

## BackEnd 개발 환경
- OS : macOS Ventura
- IDE : WebStorm
- Language : Typescript
- Framework : Node.js, Express
- Database : MySQL
- ORM : TypeORM
- AWS : EC2, RDS, S3
- API : Swagger, open API, Webstorm Http-client
- Version Control : Git
- Communication : Slack
- Project Management : Notion

## 프로젝트간 학습 목적 및 성취
- **TypeORM** : TypeORM의 문법을 사용하여 DB와의 다양한 연동을 쉽게 할 수 있도록 학습 및 실습
- **AWS S3** : AWS S3를 사용하여 파일을 저장하고 관리할 수 있도록 학습 및 실습
- **open API** : open API를 사용하여 다양한 기능을 구현할 수 있도록 학습 및 실습
- **Swagger** : Swagger를 사용하여 API 문서를 자동으로 생성할 수 있도록 학습 및 실습

## 프로젝트 구조
- **api-docs** : SwaggerUI API 문서
- **env** : 환경변수 및 설정 파일
- **db** : DB 관련 파일(DBmate migration 파일, ERD schema 파일)
- **src**
  - **controller** : API 요청을 처리하는 컨트롤러
  - **entity** : DB 테이블과 연결되는 엔티티 (DTO, typeORM viewEntities 포함)
  - **middleware** : API 요청을 처리하기 전에 실행되는 미들웨어
  - **repository** : DB 테이블에 접근하는 레포지토리
  - **routes** : API 요청을 처리하는 라우터
  - **service** : API 요청을 처리하는 서비스
  - **types** : 타입스크립트 타입 정의 파일
  - **test** : 테스트 파일 (unit test, API test 포함)
  - **utils** : 유틸리티 함수
  - **app.ts** : 서버를 실행하는 파일
  - **main.ts** : 서버를 실행하는 파일

## 프로젝트 실행 방법
- **환경변수 설정**
  - **.env** 파일 생성
  - **.env** 파일에 환경변수 설정 (환경변수 설정 방법은 **.env.example** 파일 참고)
- **DB 설정**
  - **table 및 entity 생성**
    

## License
- MIT License