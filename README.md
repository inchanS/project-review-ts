[![Integration Tests](https://github.com/inchanS/project-review-ts/actions/workflows/integration-test.yml/badge.svg?branch=main)](https://github.com/inchanS/project-review-ts/actions/workflows/integration-test.yml)  

# project-review
## 프로젝트 소개
- 프로젝트명 : project-review
- 프로젝트 설명 : 상품이나 서비스 등에 대한 리뷰를 게시할 수 있는 웹사이트 개발
- 개발 기간 : 2023.01 ~ 2023.03 (실 개발 기간 약 2개월)
- 개발 인원 : Team **Minhee-project** (2명)
  - **Back-end** : 1명 ([inchanS (Song Inchan)](https://github.com/inchanS))
  - Front-end : 1명 ([DawonOh](https://github.com/DawonOh))
 
## Release Version History
[Releases · inchanS/project-review-ts](https://github.com/inchanS/project-review-ts/releases)


## BackEnd 개발 환경
- OS : macOS Ventura
- IDE : IntelliJ, WebStorm
- Language : Typescript
- Framework : Node.js, Express
- Database : MySQL
- ORM : TypeORM
- AWS : EC2, RDS, S3
- API : Swagger, open API
- Version Control : Git
- Communication : Slack
- Project Management : Notion

## **프로젝트간 숙련 목적** 및 성취
- **TypeORM** : TypeORM의 기능을 사용하여 DB와의 다양한 연동을 쉽게 할 수 있도록 학습 및 실습
- **AWS S3** : AWS S3를 사용하여 파일을 저장하고 관리할 수 있도록 학습 및 실습
- **open API** : open API를 사용하여 다양한 기능을 구현할 수 있도록 학습 및 실습
- **Swagger** : Swagger를 사용하여 API 문서를 자동으로 생성할 수 있도록 학습 및 실습
- **OOP** : 객체지향 프로그래밍을 통해 서비스 로직간 유지보수를 용이하게 하고 그 이점을 학습 및 실습
- **Test** : Test를 사용하여 코드의 안정성을 높일 수 있도록 학습 및 실습 (**진행중**)

## 프로젝트 구조
- **api-docs** : SwaggerUI API 문서
- **env** : 서버별 환경변수 및 설정 파일 폴더
- **db** : DB 관련 파일(**DBmate** migration 파일, ERD schema 파일)
- **src**
  - **controller** : API 요청을 처리하는 컨트롤러
  - **entity** : DB 테이블과 연결되는 엔티티 (DTO, typeORM viewEntities 포함)
  - **middleware** : API 요청을 처리하기 전에 실행되는 미들웨어
  - **migration** : DB 테이블 변경시 적용할 수 있는 TypeORM 마이그레이션 파일
  - **repository** : DB 테이블에 접근하는 레포지토리
  - **routes** : API 요청을 처리하는 라우터
  - **service** : API 요청을 처리하는 서비스
  - **types** : 타입스크립트 타입 또는 인터페이스 정의 파일
  - **test** : 테스트 파일 (unit test, API test 포함)
  - **utils** : 유틸리티 함수
  - **app.ts** : 서버를 생성하는 파일
  - **main.ts** : 서버를 실행하는 파일

## API 문서
- **Swagger** : [API-docs README 참조](https://github.com/inchanS/project-review-API-docs/blob/main/README.md)

## 프로젝트 구현 기능
- **User**
  - **회원가입**
    - **회원가입**
    - **이메일 인증** 
    - **이메일 중복 확인** 
    - **닉네임 중복 확인** 
  - **로그인**
  - **회원 탈퇴** 
    - 회원 탈퇴 시, 회원이 작성한 모든 데이터는 soft delete 처리됨
    - 회원 탈퇴 시, 회원이 업로드한 모든 파일은 soft delete 처리되고, S3에서는 삭제됨
  - **회원 정보 조회** : 회원 정보를 조회할 수 있음
    - 회원별 게시글, 댓글을 조회할 수 있음
  - **회원 정보 수정** 
    - **비밀번호 찾기**
    - **비밀번호 변경**
    - **비밀번호 재설정** : 등록된 이메일을 통해 새로운 비밀번호를 설정할 수 있는 임시토큰 발행

- **Feeds**
  - **게시글 작성**
  - **게시글 수정**
  - **게시글 삭제**
  - **게시글 조회**
    - 게시글 조회시 조회수 증가
  - **게시글 목록 조회**
  - **게시글 좋아요** : 게시글에 좋아요와 같은 공감표시를 할 수 있음
    - 게시글당 좋아요는 1번만 가능
    - 게시글에 좋아요 뿐만 아닌 다른 종류의 감정 표현도 가능
    - 게시글별 좋아요 수를 조회할 수 있음
  - **게시글 좋아요 취소** : 게시글에 좋아요를 취소할 수 있음

  
- **Temp Feeds**
  - **임시 게시글 작성**  
    - 임시 게시글 작성시 **사용되지 않는 업로드 파일 자동 삭제**
  - **임시 게시글 수정** 
    - 게시글 수정시 **사용되지 않는 업로드 파일 자동 삭제**
  - **임시 게시글 삭제** 
  - **임시 게시글 조회** 
  - **임시 게시글 목록 조회** : 로그인 사용자의 임시 게시글 전체 목록을 조회할 수 있음


- **File Upload**
  - **파일 업로드** : 파일을 업로드할 수 있음 
    - 사용자 정보를 반영하여 사용자 ID를 DB Table과 AWS-S3에 매칭하여 저장
    - 한번에 하나 또는 여러개의 파일 업로드 가능
      - 파일 업로드시 한번에 가능한 파일의 개수는 5개 이하로 제한
      - 파일 업로드시 파일 하나의 크기는 5MB 이하로 제한
    - **이미지 리사이징** : width 1920px을 기준으로 리사이징하여 저장
  - **파일 삭제** : 파일을 삭제할 수 있음 
    - 사용자 유효성 검사 후, 해당 DB Table과 AWS-S3에서 삭제
  - **이미지 분류** : 파일의 종류가 이미지인지 아닌지 분류할 수 있음


- **Comments**
  - **댓글 작성** 
  - **댓글 수정** 
  - **댓글 삭제** : 댓글 삭제 시, DB에서는 **soft delete** 처리
  - **댓글 목록 조회** : 댓글 목록을 조회할 수 있음
    - 비공개 댓글의 경우, 관련 사용자만 조회 가능
      - 비공개 댓글 : 게시글 작성자와 댓글 작성자 조회 가능
      - 비공개 대댓글 : 부모 댓글 작성자와 대댓글 작성자 조회가능(게시글 작성자는 조회불가)
    - 삭제된 댓글의 경우, 해당 항목은 삭제된 댓글로 모두에게 표시
  - **대댓글 작성** : 대댓글을 작성할 수 있음 (수정, 삭제 가능)


- **category**
  - **카테고리 목록 조회** : 카테고리 목록을 조회할 수 있음


- **search**
  - **검색** 
    - 검색어를 게시글의 제목과 내용에서 검색하여 반영
    - 검색 결과는 최신순으로 정렬
    - 검색 결과의 최대개수는 클라이언트(프론트엔드)에서 결정할 수 있으며, 무한스크롤을 지원
    - 검색 결과는 게시글의 id, 제목, 내용을 포함
    - 검색 결과 반영시 총 글자수를 제한함으로 검색 맥락은 파악하되 불필요한 정보는 제외하여 가독성 향상 
      - 제목 : 검색어 앞뒤로 10글자씩 반환
      - 내용 : 검색어 앞뒤로 20글자씩 반환
  - **검색 목록 전체보기** : 검색어 목록이 많을 때 전체 목록보기를 할 수 있음
    - 검색 결과는 최신순으로 정렬
    - 검색 결과의 최대개수는 클라이언트(프론트엔드)에서 결정할 수 있으며, 무한스크롤을 지원
    - 검색 결과는 게시글의 제목, 내용, 작성자 닉네임, 작성일, 조회수, 좋아요 수, 댓글 수, 이미지 URL, 첨부파일 수, 카테고리 정보 등을 포함

## 프로젝트 실행 방법
- **환경변수 설정**
  - **.env** 파일 생성
  - **.env** 파일에 환경변수 설정 (환경변수 설정 방법은 **.env.example** 파일 참고)


- **DB 설정**
  - **table 및 entity 생성**
  - `.env`파일에서 typeorm synchronize 옵션을 `true`로 설정 후, 최초 실행 (migration - create table 코드 작성보다 간편해서 이 방법을 사용)
    - `npm run dev` 명령어를 통해 실행 (그 외 package.json에 정의된 script 명령어 참조)
  - 샘플 데이터 생성
    - table 생성 후, **DBmate**를 사용하여 샘플 데이터를 생성할 수 있음
    - `dbmate up` 명령어를 통해 샘플 데이터 생성


## 업데이트 예정
1. **Category**
  - **카테고리 추가** : 사용자가 카테고리를 추가할 수 있음


2. **Users**
  - OAuth2.0 적용
    - **카카오 로그인** : 카카오 로그인을 할 수 있음
    - **네이버 로그인** : 네이버 로그인을 할 수 있음
    - **구글 로그인** : 구글 로그인을 할 수 있음
  - **회원 정보 수정** : 회원 정보를 수정할 수 있음
    - **프로필 사진 변경** : 프로필 사진을 변경할 수 있음
    - **프로필 사진 삭제** : 프로필 사진을 삭제할 수 있음



## License
- MIT License